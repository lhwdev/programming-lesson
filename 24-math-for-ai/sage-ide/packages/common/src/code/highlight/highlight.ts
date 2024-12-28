import { BundledLanguageInfo, createHighlighterCore, Grammar, HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { bundledLanguagesInfo } from "shiki/langs";

import vitesseLight from "shiki/themes/vitesse-light.mjs";
import vitesseDark from "shiki/themes/vitesse-dark.mjs";

const langs = bundledLanguagesInfo;
const langIdMap = new Map(langs.map((lang) => [lang.id, lang]));
const langAlias = Object.fromEntries(
  langs.flatMap((lang) => lang.aliases?.map((alias) => [alias, lang.id]) ?? []),
);

export type LanguageInfo = BundledLanguageInfo;

export const Languages = {
  all: langs,
  get(id: string): LanguageInfo | null {
    return langIdMap.get(id) ?? null;
  },
  findId(idOrAlias: string) {
    return langAlias[idOrAlias] ?? idOrAlias;
  },
  find(idOrAlias: string): LanguageInfo | null {
    return this.get(this.findId(idOrAlias));
  },
};

const highlighterPromise = createHighlighterCore({
  themes: [vitesseLight, vitesseDark],
  engine: createOnigurumaEngine(import("shiki/wasm")),
  langs: [],
  langAlias,
});

export let highlighterCache: HighlighterCore | null = null;

export async function getHighlighter(): Promise<HighlighterCore> {
  if(highlighterCache) return highlighterCache;

  const result = await highlighterPromise;
  highlighterCache = result;
  return result;
}

const LoadingLanguage = new Map<LanguageInfo, Promise<{ grammar: Grammar }>>();

export function getLanguage(highlighter: HighlighterCore, info: LanguageInfo): { grammar: Grammar } | Promise<{ grammar: Grammar }> {
  if(LoadingLanguage.has(info)) return LoadingLanguage.get(info)!;

  if(highlighterCache) try {
    const cache = highlighterCache.getLanguage(info.id);
    if(cache) return { grammar: cache };
  } catch { /* no-op */ }

  return (async () => {
    await highlighter.loadLanguage(info.import);
    return { grammar: highlighter.getLanguage(info.id) };
  })();
}
