# Makedown

**A Super Simple Blog Framework in Node.js**

<img src="/public/favicon.svg" alt="Logo" width="100">

## Table of Contents

- [About](#about)
- [Dependencies](#dependencies)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Blogging](#blogging)
- [Templates](#templates)
- [Static Files](#static-files)
- [Development](#preview)
- [Building and Deployment](#building-and-deployment)
- [Feedback](#feedback)
- [License](#license)

## About

I wanted to make a simple blog without writing a bunch of boilerplate. I looked for a framework that was super customisable, small, and most importantly, super simple. I couldn't find one, so I made Makedown. The name is due to the fact that it utilizes both markdown and showdown.js. In short, Makedown is built for minimalists who want a fast, hackable blogging workflow without heavy dependencies.

## Dependencies

I have only tried node.js v22, but others should work as well. The only other dependencies are showdown.js, and express for preview.

## Getting Started

1.  **Clone the repository:** You need a local copy of this repo on your local machine. You can download the contents manually or use the git clone command. To use git clone, start in the parent folder where you want your project to be, and then run
    ```bash
    git clone https://github.com/ElectricIce3740/Makedown
    ```
    If you plan to use a remote repository, be sure to set the remote origin to the url of your repo.
2.  **Install dependencies:** Navigate to the created directory and run
    ```bash
    npm install
    ```
3.  **Configure your blog:** Edit the `.makedown.config.json` file to set your site's title and (optionaly) template paths. See the [Configuration](#configuration) section for more details.
4.  **Add your content:**
    *   Write blog posts in the `src/blogs/` directory. See the [Blogging](#blogging) section.
    *   Add static files (CSS, images) to the `src/static/` directory. See the [Static Files](#static-files) section.
    *   (Optional) Customize the HTML templates in `src/templates/`. See the [Templates](#templates) section.
5.  **Build your site:** Run:
    ```bash
    npm run build
    ```
    This will generate your static site in the `public/` directory.
6. **Preview**  Run:
    ```bash
    npm run start
    ```
    and visit [http://localhost:3000](http://localhost:3000) to preview your blog in action. See [Building and Deployment](#building-and-deployment) for more info.
7.  **Deploy:** Host the `public/` directory on any static hosting provider. See [Building and Deployment](#building-and-deployment) for more info.

## Configuration

The main configuration for your blog is in the `.makedown.config.json` file. Here are the available options:

*   `title`: The main title of your website. This is available in your templates as `{{ title }}`.
*   `templateRoutes`: An object that specifies which template files to use for different parts of your site. You shouldn't need to mess with this unless you are building your own modifications
    *   `main`: The template for your main `index.html` page (the page that lists all your blog posts).
    *   `pages`: The template for individual blog post pages.

Example `.makedown.config.json`:

```json
{
  "title": "My Awesome Blog",
  "templateRoutes": {
    "main": "main.html",
    "pages": "pages.html"
  }
}
```

And that's about it for now. Maybe I'll add more in the future.

## Templates

The templating engine allows you to insert your blog data into HTML templates. Makedown uses a custom lightweight templating syntax. {{ ... }} is used for variable interpolation, and [[( ... ) ]] is used for loops. This is not Mustache or Handlebars — it’s a minimal system built specifically for Makedown.

### Placeholders

You can insert data into your templates using double curly braces `{{ }}`. Use dot notation to access nested data from your configuration and post metadata.

**Available Variables:**

*   **Main Template (`main.html`):**
    *   `title`: The site title from `.makedown.config.json`.
    *   `blogcontent.posts`: An array of all your blog posts.
*   **Page Template (`pages.html`):**
    *   `page.content`: The Markdown from `content.md`, converted to HTML.
    *   `page.meta`: The metadata from `meta.json`.

**Example:**

```html
<h1>{{ page.meta.title }}</h1>
<p>By {{ page.meta.author }}</p>
<div>{{ page.content }}</div>
```

### Loops

You can loop over arrays (like the list of blog posts) using the `[[(...)]]` syntax. The current item in the loop is available as the `item` variable.

**Example (in `main.html`):**

```html
<ul>
  [[(blogcontent.posts)
    <li><a href="{{ item.url }}">{{ item.title }}</a></li>
  ]]
</ul>
```

## Blogging

To create a new blog post, follow these steps:

1.  Create a new directory inside the `src/blogs/` directory. The name of this directory will be used as the URL for your blog post (e.g., `my-first-post`).
2.  Inside your new post directory, create two files:
    *   `content.md`: This file will contain the content of your blog post, written in Markdown.
    *   `meta.json`: This file contains metadata for your post. It must be a valid JSON object and contain at least a `title` key. You can also include any other data you need.

**Example `meta.json`:**

```json
{
  "title": "My First Post",
  "author": "John Doe",
  "date": "2025-08-27"
}
```

## Static Files

Any files placed in the `src/static/` directory will be copied directly to the `public/` directory when you run the build script. The directory structure is preserved.

This is the ideal place for your CSS, images, fonts, or any other static assets.

For example, a file at `src/static/css/style.css` will be copied to `public/css/style.css`.

## Preview

To preview your blog locally, you can run the development server:

```bash
npm run start
```

This will start a server and your blog will be available at [http://localhost:3000](http://localhost:3000).

## Building and Deployment

The `npm run build` command generates a fully static website in the `public/` directory. You can host this directory on any static web hosting service.

Simply upload the contents of the `public/` directory to your hosting provider. There are plenty of free services to get you started.

While you can run the site in a Node.js environment, using a dedicated static hosting service is recommended for performance and simplicity.

## Feedback 

If you have any questions, comments, or suggestions, please [file a GitHub issue](https://github.com/ElectricIce3740/Makedown/issues). I would love to hear from you!

## License

Makedown uses the MIT License, so feel free to make your own version if you'd like!
