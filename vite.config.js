import { resolve } from "path";
import FullReload from 'vite-plugin-full-reload'
import dotenv from "dotenv";
import { defineConfig } from "vite";
import serverConfig from "./server.config";
import handlebars from "vite-plugin-handlebars";
import tsconfigPaths from "vite-tsconfig-paths";
import viteImagemin from "vite-plugin-imagemin";
import { createHtmlPlugin } from "vite-plugin-html";
import autoprefixer from "autoprefixer";
import postcssCombineMediaQuery from "postcss-combine-media-query";
import postcssSortMediaQueries from "postcss-sort-media-queries";
import postcssPresetEnv from "postcss-preset-env";

const root = resolve(__dirname, 'src/html/pages');
const outDir = "build"; // Output directory with files after building
dotenv.config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  base: "/", // Public path for serving files  (Must be the same as Django STATIC_URL + DJANGO_VITE_STATIC_URL_PREFIX parameter)
  publicDir: "../public/",
  preview: {
    port: 8080,
    strictPort: true,
  },
  server: serverConfig,

  plugins: [
    tsconfigPaths(),
    handlebars({
      reloadOnPartialChange: true,
      partialDirectory: resolve(__dirname, "src/html/"),
      helpers: {
        eq: (a, b) => a === b,
        eqString: (a, b) => a.trim() === b.trim(),
        and: (a, b) => a && b,
        baseUrl: () => process.env.VITE_BASE_URL || '/default/base/url',
      },
      assetPath: (path) => `/assets/${path}`,
    }),

    FullReload('./**/*', {delay: 0}),

    viteImagemin({
      skipIfLarger: true,
      clearCache: true,
      gifsicle: {
        optimizationLevel: 2,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 2,
      },
      mozjpeg: {
        quality: 75,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: "removeViewBox",
          },
          {
            name: "removeEmptyAttrs",
            active: false,
          },
        ],
      },
    }),

    createHtmlPlugin({
      minify: true, // Опція для мініфікації HTML
      collapseWhitespace: true, // Об'єднує всі пробіли та нові рядки
      removeComments: true, // Видаляє всі коментарі з HTML-коду.
      removeEmptyAttributes: true, // Видаляє порожні атрибути з HTML-елементів (наприклад, class="")
      removeRedundantAttributes: true, // Видаляє атрибути, значення яких є за замовчуванням (наприклад, type="text" для <input>).
      minifyCSS: true, // Мініфікує CSS, вбудований у HTML.
      minifyJS: true, // Мініфікує JS, вбудований у HTML.
    }),
  ],

  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        postcssPresetEnv(),
        postcssCombineMediaQuery(),
        postcssSortMediaQueries({ sort: "desktop-first" }),
      ],
    },
  },
 
  build: {
    outDir,
    manifest: "manifest.json",
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
        unused: true,
        join_vars: true,
      },
      parse: {
        html5_comments: false,
        shebang: false,
      },
      format: {
        comments: false, // Видаляє всі коментарі
      },
      safari10: true,
    },
    rollupOptions: {
      input: {
        main: resolve('/index.html'),
        about: resolve('src/html/pages/about/index.html'),
      },
      output: {
        assetFileNames: ({name}) => {
            name = name.toLowerCase()
  
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]'
            }
  
            if (/\.css$/.test(name ?? '')) {
              return 'assets/styles/[name]-[hash][extname]'
            }
  
            if (/\.js$/.test(name ?? '')) {
              return 'assets/js/[name]-[hash][extname]'
            }
  
            // default value
            return 'assets/[name]-[hash][extname]'
          },
      },
    },
  },

  resolve: {
    alias: {
      '@': root,
    },
  },
});
