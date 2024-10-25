import { classNameForScope, classNameForScopes, highlighterCache, tokenizeCode } from "@sage-ide/common/code/highlight/index.ts";
import { findChildren } from "@tiptap/core";
import { Node, NodeType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import clsx from "clsx";
import { HighlighterCore } from "shiki/core";

const styleElement = document.createElement("style");
document.body.appendChild(styleElement);
const stylesheet = styleElement.sheet;

const stylesCache = new Map<string, string>(); // color to styleName

function getStyleForColor(color: string) {
  const previous = stylesCache.get(color);
  if(previous) return previous;

  const name = `bn-cb${nameForColor(color)}`;
  stylesheet!.insertRule(`.${name} { color: ${color}; }`);
  stylesCache.set(color, name);
  return name;
}

function hashCode(s: string) {
  let h = 0;
  for(let i = 0; i < s.length; i++)
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
}

function nameForColor(color: string) {
  let hash = null;
  if(color.startsWith("#")) try {
    hash = color.slice(1);
  } catch (_) {
    // fallthrough
  }
  if(hash === null) hash = Math.abs(hashCode(color));
  return hash;
}

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

function getDecorations(doc: Node, type: NodeType, highlighter: HighlighterCore) {
  const decorations: Decoration[] = [];
  const theme = highlighter.getTheme("vitesse-light");

  findChildren(doc, (node) => node.type === type).forEach((block) => {
    const language = block.node.attrs.language || "plain";
    const languages = highlighter.getLoadedLanguages();

    const hasLanguage = language && (languages.includes(language) || language === "plain" || language === "text");
    if(!hasLanguage) {
      console.error(language, languages);
      throw new Error("no language");
    }

    const offset = block.pos + 1;
    /* const tokens = highlighter.codeToTokens(block.node.textContent, { lang: language, theme }).tokens;

    for(const tokenLine of tokens) {
      for(const token of tokenLine) {
        const from = token.offset;
        const to = from + token.content.length;
        let decoration;
        if(token.color) {
          // Note: Decoration.to is inclusive
          decoration = Decoration.inline(offset + from, offset + to, {
            // style: `color: ${token.color};`,
            class: getStyleForColor(token.color),
          });
          decorations.push(decoration);
        }
      }
    } */

    const tokens = tokenizeCode(block.node.textContent, language, highlighter);
    for(const token of tokens) {
      const decoration = Decoration.inline(
        offset + token.startIndex,
        offset + token.endIndex,
        { class: clsx(classNameForScopes(token.scopes)) },
      );
      decorations.push(decoration);
    }
  });

  return DecorationSet.create(doc, decorations);
}
