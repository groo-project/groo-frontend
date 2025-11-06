const SitemapPlugin = require('sitemap-webpack-plugin').default;

// Example of simple string paths
const paths = [
  '/landing/',
  '/login/',
  '/signup/',
  '/tutorial/'
];

// Example webpack configuration -- input/output/etc. omitted for brevity.
export default {
  // Basic usage (output defaults to sitemap.xml)
  plugins: [
    new SitemapPlugin({ base: 'https://groogarden.com', paths })
  ]
};
