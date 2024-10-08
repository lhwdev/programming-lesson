import { getHighlighter } from "@sage-ide/common/code/highlight.ts";
import { shikiToMonaco } from "@shikijs/monaco";
import { ShikiInternal } from "shiki";

/// See https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/src/browser/main.ts
export async function createMonaco(element: HTMLElement) {
  const highlighter = await getHighlighter();

  monaco.languages.register({ id: "python" });
  shikiToMonaco(highlighter as ShikiInternal<any, any>, monaco);

  const editor = monaco.editor.create(element, {
    value: "print('hi')",
    language: "python",
    theme: "vitesse-light",
  });
  return editor;
}
