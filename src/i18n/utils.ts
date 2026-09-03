// src/i18n/utils.ts
//
// Small helpers around the ./ui.ts dictionary. `useTranslations(lang)`
// is the one every page/component actually calls: it returns a `t()`
// function already bound to a locale, so call sites read as
// `t("education.title")` instead of repeating `ui[lang][...]` and a
// fallback check everywhere a string is needed.

import { ui, defaultLang } from "./ui";

export type Lang = keyof typeof ui;
export type UIKey = keyof (typeof ui)[typeof defaultLang];

export function useTranslations(lang: string | undefined) {
  const activeLang: Lang = lang && lang in ui ? (lang as Lang) : defaultLang;

  return function t(key: UIKey): string {
    // Falls back to the default-language string for any key a locale
    // hasn't got its own entry for yet, rather than rendering blank --
    // relevant once real translated copy starts landing one section
    // at a time instead of all at once.
    return ui[activeLang][key] ?? ui[defaultLang][key];
  };
}
