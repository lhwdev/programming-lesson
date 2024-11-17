import { classNameForScopeUsage, highlighterCache, tokenizeCode } from "@sage-ide/common/code/highlight/index.ts";
import { findChildren } from "@tiptap/core";
import { Node, NodeType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Grammar, HighlighterCore } from "shiki/core";

const styleElement = document.createElement("style");
document.body.appendChild(styleElement);

export function codeBlockHighlightPlugin({ type }: { type: NodeType }) {
  return new Plugin<DecorationSet>({
    key: new PluginKey("codeBlock-highlight"),

    state: {
      init(_, instance) {
        if(!highlighterCache) return DecorationSet.empty;
        return getDecorations(instance.doc, type, highlighterCache);
      },
      apply(tr, decorationSet, oldState, newState) {
        if(!highlighterCache) return decorationSet;
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;
        const oldNodes = findChildren(oldState.doc, (node) => node.type === type);
        const newNodes = findChildren(newState.doc, (node) => node.type === type);

        if(
          tr.docChanged
          // Apply decorations if:
          // selection includes named node,
          && ([oldNodeName, newNodeName].includes(type.name)
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
          return getDecorations(tr.doc, type, highlighterCache);
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
}

export function grammarForCodeBlock(language: string, highlighter: HighlighterCore): Grammar {
  language = language || "plain";
  const languages = highlighter.getLoadedLanguages();

  const hasLanguage = language && (languages.includes(language) || language === "plain" || language === "text");
  if(!hasLanguage) {
    console.error(language, languages);
    throw new Error("no language");
  }

  return highlighter.getLanguage(language);
}

function getDecorations(doc: Node, type: NodeType, highlighter: HighlighterCore) {
  const decorations: Decoration[] = [];

  findChildren(doc, (node) => node.type === type).forEach((block) => {
    const grammar = grammarForCodeBlock(block.node.attrs.language, highlighter);
    const offset = block.pos + 1;

    const { rootScopeName, tokens } = tokenizeCode(block.node.textContent, grammar);
    decorations.push(
      Decoration.node(
        block.pos,
        block.pos + block.node.nodeSize,
        {
          "class": classNameForScopeUsage([rootScopeName]),
          "data-hoi": rootScopeName,
        },
      ),
    );
    for(const token of tokens) {
      const decoration = Decoration.inline(
        offset + token.startIndex,
        offset + token.endIndex,
        {
          class: classNameForScopeUsage(token.scopes),
          ...import.meta.env.DEV && { "data-scopes": token.scopes.join(" ") },
        },
      );
      decorations.push(decoration);
    }
  });

  return DecorationSet.create(doc, decorations);
}
