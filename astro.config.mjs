// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://princesssarmica.github.io',
    // Tags optimised images with a Display P3 profile so they match the
    // wide-gamut CSS colours in Layout.astro (see the service file).
    image: {
        service: { entrypoint: './src/image-service-p3.mjs' },
    },
    base: '/personal-cv-page',
    // Site supports three locales: English (default, served at the site
    // root with no prefix), German, and Slovenian.
    i18n: {
        locales: ["en", "de", "sl"],
        defaultLocale: "en",
    },
});
