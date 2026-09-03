// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://princesssarmica.github.io',
    base: '/personal-cv-page',
    // Site supports three locales: English (default, served at the site
    // root with no prefix), German, and Slovenian.
    i18n: {
        locales: ["en", "de", "sl"],
        defaultLocale: "en",
    },
});
