import { createHighlighterCore, HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

import vitesseLight from "shiki/themes/vitesse-light.mjs";
import vitesseDark from "shiki/themes/vitesse-dark.mjs";

export const languages = [
  "python",
  "latex",
];
import("shiki/langs/python.mjs");

const highlighterPromise = createHighlighterCore({
  themes: [vitesseLight, vitesseDark],
  engine: createOnigurumaEngine(import("shiki/wasm")),
  langs: [
    import("shiki/langs/python.mjs"),
    import("shiki/langs/latex.mjs"),
  ],
});

export let highlighterCache: HighlighterCore | null = null;

export async function getHighlighter(): Promise<HighlighterCore> {
  const result = await highlighterPromise;
  highlighterCache = result;
  return result;
}

getHighlighter();
