import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import sitemap from 'vite-plugin-sitemap';

const paths = [
    '/', 
    '/landing',
    '/login',
    '/signup',
    '/tutorial',
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(),
    sitemap({
      hostname: 'https://groogarden.com',
      dynamicRoutes: paths,
      outDir: 'dist'
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
