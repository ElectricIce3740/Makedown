const fs = require('fs').promises;
const path = require('path');
const showdown = require('showdown');

const converter = new showdown.Converter();

const paths = {
  public: 'public',
  blogs: 'src/blogs',
  templates: 'src/templates',
  config: '.blisss.config.json'
};

function fillTemplate(template, data) {
    return template.replace(/{{(.*?)}}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = data;
        for (const k of keys) {
            if (value === undefined) return match;

            const arrayMatch = k.match(/(\w+)\[(\d+)\]/);
            if (arrayMatch) {
                const arrayName = arrayMatch[1];
                const index = parseInt(arrayMatch[2], 10);
                if (value[arrayName] && Array.isArray(value[arrayName])) {
                    value = value[arrayName][index];
                } else {
                    return match;
                }
            } else if (typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                throw new Error(`Key not found: ${k} in ${key}`);
            }
        }
        return value;
    });
}

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
    throw error;
  }
}

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
            return {
              dir: dirent.name,
              meta: JSON.parse(metaContent)
            };
          } catch (error) {
            // Log error for this specific post and filter it out
            console.error(`Error reading meta.json for post '${dirent.name}':`, error);
            return null;
          }
        })
    );
    // Filter out any posts that had errors
    return posts.filter(post => post !== null);
  } catch (error) {
    console.error('Error reading blogs directory:', error);
    throw error;
  }
}

async function buildBlogPage(post, pagesTemplate) {
  try {
    const contentPath = path.join(paths.blogs, post.dir, 'content.md');
    const blogContent = await fs.readFile(contentPath, 'utf-8');
    const blogHtml = converter.makeHtml(blogContent);

    const pageData = {
        page: {
            content: blogHtml,
            meta: post.meta,
            title: post.meta.title
        }
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
    console.error(`Error building blog page for ${post.dir}:`, error);
    return null;
  }
}

async function main() {
  try {
    await ensureDirectoryExists(paths.public);

    const configContent = await fs.readFile(paths.config, 'utf-8');
    const config = JSON.parse(configContent);

    const mainTemplatePath = path.join(paths.templates, config.routes.main);
    const mainTemplate = await fs.readFile(mainTemplatePath, 'utf-8');

    const pagesTemplatePath = path.join(paths.templates, config.routes.pages);
    const pagesTemplate = await fs.readFile(pagesTemplatePath, 'utf-8');

    const blogPostsMeta = await getBlogPosts();

    const builtPosts = (await Promise.all(blogPostsMeta.map(post => buildBlogPage(post, pagesTemplate)))).filter(p => p);

    const blogcontent = {
        posts: builtPosts
    };

    const indexHtml = fillTemplate(mainTemplate, { config: config, blogcontent: blogcontent });
    const indexPath = path.join(paths.public, 'index.html');
    await fs.writeFile(indexPath, indexHtml);
    console.log('Successfully built index.html');

  } catch (error) {
    console.error('An unexpected error occurred during the build process:', error);
    process.exit(1);
  }
}

main();