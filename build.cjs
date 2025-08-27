
// =================================================================
// BUILD SCRIPT
// =================================================================
// This script builds the static HTML pages for the blog.
// It reads Markdown files, converts them to HTML, and injects
// them into templates.
// =================================================================

// -----------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------
// Import required Node.js modules.
// - fs/promises: For asynchronous file system operations.
// - path: For working with file and directory paths.
// - showdown: For converting Markdown to HTML.
// -----------------------------------------------------------------
const fs = require('fs').promises;
const path = require('path');
const { title, config } = require('process');
const showdown = require('showdown');

// -----------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------
// Create a new Showdown converter to transform Markdown into HTML.
// -----------------------------------------------------------------
const markdownConverter = new showdown.Converter();

// -----------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------
// Define the paths for various directories and files used in the
// build process. This makes it easy to manage file locations.
// -----------------------------------------------------------------
const paths = {
  public: 'public',
  blogs: 'src/blogs',
  templates: 'src/templates',
  config: '.blisss.config.json',
  static: 'src/static'
};

// =================================================================
// TEMPLATING ENGINE
// =================================================================
// The following functions implement a simple templating engine
// that replaces placeholders in template files with actual data.
// It supports both simple value replacement (e.g., {{ page.title }})
// and loops for rendering lists (e.g., [[(blogcontent.posts) ... ]]).
// =================================================================

/**
 * Recursively resolves a dot-notation path to a value within a nested object.
 * This function is a key part of the templating engine, allowing access to
 * nested data properties like 'page.meta.title'. It also supports array access
 * using bracket notation, e.g., 'posts[0]'.
 *
 * @param {string} pathString - The dot-notation path to resolve (e.g., "page.title").
 * @param {object} data - The object to resolve the path against.
 * @returns {any} The resolved value.
 * @throws {Error} If the path cannot be resolved.
 */
function resolvePath(pathString, data) {
  const keys = pathString.trim().split('.');
  let currentValue = data;

  for (const key of keys) {
    if (currentValue === undefined || currentValue === null) {
      throw new Error(`[Bliss] Cannot resolve path: '${pathString}'. Part of the path is undefined or null.`);
    }

    const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      if (currentValue[arrayName] && Array.isArray(currentValue[arrayName])) {
        currentValue = currentValue[arrayName][index];
      } else {
        throw new Error(`[Bliss] Cannot resolve array part of path: '${key}' in '${pathString}'.`);
      }
    } else if (typeof currentValue === 'object' && key in currentValue) {
      currentValue = currentValue[key];
    } else {
      throw new Error(`[Bliss] Key not found: '${key}' in '${pathString}'`);
    }
  }
  return currentValue;
}


/**
 * Replaces simple placeholders in a template with data.
 * Placeholders are identified by double curly braces, e.g., {{ page.title }}.
 *
 * @param {string} template - The template string to process.
 * @param {object} data - The data to use for replacements.
 * @returns {string} The template with placeholders replaced.
 */
function replacePlaceholders(template, data) {
  return template.replace(/{{(.*?)}}/g, (match, key) => {
    try {
      return resolvePath(key, data);
    } catch (error) {
      // If a key is not found, log a warning and return the original placeholder.
      // This is useful for debugging templates without halting the build.
      console.warn(`[Bliss] Template Warning: ${error.message}. The placeholder '${match}' will not be replaced.`);
      return match;
    }
  });
}

/**
 * Processes loop structures in a template.
 * Loops are defined by [[(array.path) ...loop content... ]].
 *
 * @param {string} template - The template string to process.
 * @param {object} data - The data containing the arrays to loop over.
 * @returns {string} The processed template with loops unrolled.
 */
function processLoops(template, data) {
  const loopRegex = /\[\[\((.*?)\)\s*([\s\S]*?)\]\]/g;

  return template.replace(loopRegex, (match, arrayPath, loopTemplate) => {
    const array = resolvePath(arrayPath, data);
    if (!Array.isArray(array)) {
      throw new Error(`[Bliss] Path '${arrayPath}' did not resolve to an array.`);
    }

    let result = '';
    for (const item of array) {
      const loopData = { ...data, item: item };
      // Recursively fill the template for each item in the array.
      // This allows nested loops and placeholder replacements within loops.
      result += fillTemplate(loopTemplate, loopData);
    }
    return result;
  });
}

/**
 * Fills a template with data, processing both loops and placeholders.
 * This is the main function for the templating engine.
 *
 * @param {string} template - The template string.
 * @param {object} data - The data to fill the template with.
 * @returns {string} The fully rendered HTML.
 */
function fillTemplate(template, data) {
  const loopProcessedTemplate = processLoops(template, data);
  return replacePlaceholders(loopProcessedTemplate, data);
}


// =================================================================
// FILE SYSTEM OPERATIONS
// =================================================================
// These functions handle interactions with the file system, such as
// creating directories, copying files, and reading blog post data.
// =================================================================

/**
 * Ensures that a directory exists, creating it if it doesn't.
 * This is useful for making sure the output directory is ready.
 *
 * @param {string} dirPath - The path to the directory.
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`[Bliss] Fatal: Could not create directory at '${dirPath}'. Please check permissions.`);
    throw error;
  }
}

/**
 * Recursively copies static files from a source to a destination.
 * This is used to copy assets like CSS, images, and fonts.
 *
 * @param {string} sourceDir - The source directory.
 * @param {string} destinationDir - The destination directory.
 */
async function copyStaticFiles(sourceDir, destinationDir) {
  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    await ensureDirectoryExists(destinationDir);
    for (let entry of entries) {
      const srcPath = path.join(sourceDir, entry.name);
      const destPath = path.join(destinationDir, entry.name);
      if (entry.isDirectory()) {
        await copyStaticFiles(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
        console.log(`Copied static file: ${srcPath} to ${destPath}`);
      }
    }
  } catch (error) {
    // If the source directory doesn't exist, we can just return. This is not a fatal error.
    if (error.code === 'ENOENT') {
      console.warn(`[Bliss] Info: Static assets directory not found at '${sourceDir}'. Skipping copy.`);
      return;
    }
    console.error(`[Bliss] Fatal: Error copying static files from '${sourceDir}'.`, error);
    throw error;
  }
}

/**
 * Retrieves a list of all blog posts by reading their metadata.
 * Each blog post is expected to have a 'meta.json' file.
 *
 * @returns {Promise<Array>} A promise that resolves to a list of post metadata.
 */
async function getBlogPosts() {
  try {
    const postDirs = await fs.readdir(paths.blogs, { withFileTypes: true });
    const posts = await Promise.all(
      postDirs
        .filter(dirent => dirent.isDirectory())
        .map(async (dirent) => {
          const metaPath = path.join(paths.blogs, dirent.name, 'meta.json');
          try {
            const metaContent = await fs.readFile(metaPath, 'utf-8');
            const meta = JSON.parse(metaContent);
            return {
              dir: dirent.name,
              meta: meta
            };
          } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`[Bliss] Error: Missing 'meta.json' for post '${dirent.name}'. Skipping.`);
            } else if (error instanceof SyntaxError) {
                console.error(`[Bliss] Error: Invalid JSON in 'meta.json' for post '${dirent.name}'. Skipping. Details: ${error.message}`);
            } else {
                console.error(`[Bliss] Error: Could not read metadata for post '${dirent.name}'. Skipping.`, error);
            }
            return null;
          }
        })
    );
    return posts.filter(post => post !== null);
  } catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`[Bliss] Fatal: The blogs directory was not found at '${paths.blogs}'.`);
    } else {
        console.error(`[Bliss] Fatal: Could not read blogs directory at '${paths.blogs}'.`, error);
    }
    throw error;
  }
}


// =================================================================
// PAGE BUILDING
// =================================================================
// These functions are responsible for building the individual
// blog pages and the main index page.
// =================================================================

/**
 * Builds a single blog page from a post's data and a template.
 *
 * @param {object} post - The post data (directory and metadata).
 * @param {string} pagesTemplate - The template for individual blog pages.
 * @returns {Promise<object|null>} A promise that resolves to the built post data, or null on error.
 */
async function buildBlogPage(post, pagesTemplate, config) {
  try {
    const contentPath = path.join(paths.blogs, post.dir, 'content.md');
    const blogContent = await fs.readFile(contentPath, 'utf-8');
    const blogHtml = markdownConverter.makeHtml(blogContent);

    const pageData = {
        page: {
            content: blogHtml,
            meta: post.meta,
            url: post.dir
        },
        title: config.title
    };
    const finalHtml = fillTemplate(pagesTemplate, pageData);

    const outputFileName = `${post.dir}.html`;
    const outputPath = path.join(paths.public, outputFileName);
    await fs.writeFile(outputPath, finalHtml);
    console.log(`Successfully built ${outputFileName}`);

    return {
        ...post.meta,
        url: `/${outputFileName}`,
        content: blogHtml,
        title: post.meta.title,
        meta: post.meta
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`[Bliss] Error: Missing 'content.md' for post '${post.dir}'. Skipping page generation.`);
    } else {
        console.error(`[Bliss] Error: Failed to build page for post '${post.dir}'. Skipping.`, error);
    }
    return null;
  }
}

/**
 * The main function that orchestrates the entire build process.
 */
async function main() {
  try {
    // 1. Setup: Clear the public directory, ensure it exists, and copy static files.
    await fs.rm(paths.public, { recursive: true, force: true });
    await ensureDirectoryExists(paths.public);
    await copyStaticFiles(paths.static, paths.public);

    // 2. Configuration: Load the site's configuration file.
    let config;
    try {
        const configContent = await fs.readFile(paths.config, 'utf-8');
        config = JSON.parse(configContent);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`[Bliss] Fatal: Configuration file not found at '${paths.config}'.`);
        } else if (error instanceof SyntaxError) {
            console.error(`[Bliss] Fatal: Invalid JSON in configuration file '${paths.config}'.`);
        } else {
            console.error(`[Bliss] Fatal: Could not read configuration file at '${paths.config}'.`, error);
        }
        throw error;
    }

    // 3. Templates: Load the main and page templates.
    let mainTemplate, pagesTemplate;
    try {
        const mainTemplatePath = path.join(paths.templates, config.routes.main);
        mainTemplate = await fs.readFile(mainTemplatePath, 'utf-8');
        const pagesTemplatePath = path.join(paths.templates, config.routes.pages);
        pagesTemplate = await fs.readFile(pagesTemplatePath, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`[Bliss] Fatal: A template file was not found. Please check your config routes and template files. Path: ${error.path}`);
        } else {
            console.error(`[Bliss] Fatal: Could not read template files.`, error);
        }
        throw error;
    }

    // 4. Blog Posts: Get metadata for all blog posts.
    const blogPostsMeta = await getBlogPosts();

    // 5. Build Pages: Build each individual blog page.
    const builtPosts = (await Promise.all(blogPostsMeta.map(post => buildBlogPage(post, pagesTemplate, config)))).filter(p => p);

    // 6. Build Index: Build the main index page with a list of all posts.
    const blogContent = {
        posts: builtPosts
    };
    const indexHtml = fillTemplate(mainTemplate, { title: config.title, blogcontent: blogContent });
    const indexPath = path.join(paths.public, 'index.html');
    await fs.writeFile(indexPath, indexHtml);
    console.log('Successfully built index.html');

  } catch (error) {
    console.error('\n[Bliss] Build failed. Please see details above.');
    process.exit(1);
  }
}

// =================================================================
// EXECUTION
// =================================================================
// Run the main build function.
// =================================================================
main();

