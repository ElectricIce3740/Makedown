# Blogdown

**A Super Simple Blog Framework in Node.js**

# How To Use

1. Clone this repo: `git clone https://github.com/directory`
2. (optional) Configure the templates in the src/templates/ directory, or use prompt AI to make one for you by giving it the instructions in the [Templates Section](#templates).
3. Write blogs in src/blogs/ directory, for more info see the [Bloging Section](#bloging).
4. Put any static files in the src/static directory, for more info see the [Static Files Section](#static-files).
5. Run the build script: `npm run build`
6. Host with the provider of your choice. For more info see the [Hosting Section](#hosting).

# Templates

The templating engine is simple but powerful.

### Placeholders

You can insert data into your templates using double curly braces. You can use dot notation to access nested data.

**Example:**

```html
<h1>{{ page.meta.title }}</h1>
<p>By {{ page.meta.author }}</p>
<div>{{ page.content }}</div>
```

### Loops

You can loop over arrays in your data (like a list of blog posts) using a special syntax:

**Example:**

```html
<ul>
  [[(blogcontent.posts)
    <li><a href="{{ item.url }}">{{ item.title }}</a></li>
  ]]
</ul>
```

In this example, `blogcontent.posts` is an array of post objects. The content inside the `[[(...)]]` block will be repeated for each item in the array. The current item in the loop is available as the `item` variable.

# Bloging

To create a new blog post, follow these steps:

1.  Create a new directory inside the `src/blogs/` directory. The name of this directory will be used as the URL for your blog post (e.g., `my-first-post`).
2.  Inside your new post directory, create two files:
    *   `content.md`: This file will contain the content of your blog post, written in Markdown.
    *   `meta.json`: This file contains metadata for your post. It must be a valid JSON object and contain at least a `title` key. It can also include any arbitrary data you would like. For example:
        ```json
        {
          "title": "My First Post",
          "author": "John Doe",
          "date": "2025-08-27"
        }
        ```

# Static Files

Any files placed in the `src/static/` directory will be copied to the `public/` directory when you run the build script. This is the place for your CSS, images, or any other static assets. The directory structure is preserved.

For example, a file at `src/static/css/style.css` will be copied to `public/css/style.css`.

# Hosting

The `npm run build` command generates a fully static website in the `public/` directory. You can host this directory on any static web hosting service. Some popular options include:

*   GitHub Pages
*   Netlify
*   Vercel
*   AWS S3

Simply upload the contents of the `public/` directory to your hosting provider.

# Configuration

The main configuration for your blog is in the `.blisss.config.json` file. Here are the available options:

*   `title`: The main title of your website. This is available in your templates as `{{ title }}`.
*   `routes`: An object that specifies which template files to use for different parts of your site.
    *   `main`: The template for your main `index.html` page (the page that lists all your blog posts).
    *   `pages`: The template for individual blog post pages.

And that's about it for now. Maybe I'll add more in the future.

Example `.blisss.config.json`:

```json
{
  "title": "My Awesome Blog",
  "routes": {
    "main": "main.html",
    "pages": "pages.html"
  }
}
```

# Other

## Templating

The templating engine is simple but powerful.

### Placeholders

You can insert data into your templates using double curly braces. You can use dot notation to access nested data.

**Example:**

```html
<h1>{{ page.meta.title }}</h1>
<p>By {{ page.meta.author }}</p>
<div>{{ page.content }}</div>
```

### Loops

You can loop over arrays in your data (like a list of blog posts) using a special syntax:

**Example:**

```html
<ul>
  [[(blogcontent.posts)
    <li><a href="{{ item.url }}">{{ item.title }}</a></li>
  ]]
</ul>
```

In this example, `blogcontent.posts` is an array of post objects. The content inside the `[[(...)]]` block will be repeated for each item in the array. The current item in the loop is available as the `item` variable.