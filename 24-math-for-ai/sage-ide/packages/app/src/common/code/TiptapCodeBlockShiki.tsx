import { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { highlighterCache } from "@sage-ide/common/code/highlight.ts";
import { HighlighterCore } from "shiki/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { findChildren } from "@tiptap/react";
import { CodeBlock } from "./TiptapCodeBlock";

export const CodeBlockShiki = CodeBlock.extend({
  name: "code_shiki",

  addProseMirrorPlugins() {
    return [
      ...this.parent?.() || [],
      shikiPlugin(this.name),
    ];
  },
});

function shikiPlugin(name: string) {
  const shikiPlugin: Plugin<DecorationSet> = new Plugin<DecorationSet>({
    key: new PluginKey(name),
    state: {
      init(_, instance) {
        if(!highlighterCache) return DecorationSet.empty;
        return getDecorations(instance.doc, name, highlighterCache);
      },
      apply(tr, decorationSet, oldState, newState) {
        if(!highlighterCache) return decorationSet;
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;
        const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
        const newNodes = findChildren(newState.doc, (node) => node.type.name === name);

        if(
          tr.docChanged
          // Apply decorations if:
          // selection includes named node,
          && ([oldNodeName, newNodeName].includes(name)
            // OR transaction adds/removes named node,
            || newNodes.length !== oldNodes.length
            // OR transaction has changes that completely encapsulte a node
            // (for example, a transaction that affects the entire document).
            // Such transactions can happen during collab syncing via y-prosemirror, for example.
            || tr.steps.some((step_) => {
              const step = step_ as unknown as { from: number; to: number };
              return (
                step.from !== undefined
                && step.to !== undefined
                && oldNodes.some((node) => {
                  return (
                    node.pos >= step.from
                    && node.pos + node.node.nodeSize <= step.to
                  );
                })
              );
            }))
        ) {
          return getDecorations(tr.doc, name, highlighterCache);
        }

        return decorationSet.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
  return shikiPlugin;
}

function getDecorations(doc: Node, name: string, highlighter: HighlighterCore) {
  const decorations: Decoration[] = [];
  const theme = highlighter.getTheme("vitesse-light");

  findChildren(doc, (node) => node.type.name === name).forEach((block) => {
    const language = block.node.attrs.language || "plain";
    const languages = highlighter.getLoadedLanguages();

    const hasLanguage = language && (languages.includes(language) || language === "plain" || language === "text");
    if(!hasLanguage) {
      console.error(language, languages);
      throw new Error("no language");
    }

    const tokens = highlighter.codeToTokens(block.node.textContent, { lang: language, theme }).tokens;

    const offset = block.pos + 1;
    for(const tokenLine of tokens) {
      for(const token of tokenLine) {
        const from = token.offset;
        const to = from + token.content.length;
        let decoration;
        if(token.color) {
          // Note: Decoration.to is inclusive
          decoration = Decoration.inline(offset + from, offset + to, {
            // TODO: fontStyle
            style: `color: ${token.color};`,
          });
          decorations.push(decoration);
        }
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}
