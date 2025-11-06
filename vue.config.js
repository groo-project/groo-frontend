import SitemapPlugin from 'sitemap-webpack-plugin';

// 정적 경로
const staticPaths = [
  '/landing',
  '/login',
  '/signup',
  '/tutorial',
];

const allPaths = [...staticPaths];

export const configureWebpack = {
    plugins: [
        new SitemapPlugin({
            base: 'https://groogarden.com',
            paths: allPaths,
            options: {
                filename: 'sitemap.xml',
                lastmod: true,
                changefreq: 'weekly',
                priority: '0.8'
            },
        }),
    ],
};
