import { createReactBlockSpec } from "@blocknote/react";
import { CodeBlockView } from "./CodeBlockView";
import { ResolvedPos, Slice } from "@tiptap/pm/model";
import { insertOrUpdateBlock } from "@blocknote/core";
import { AllSelection, Selection, TextSelection } from "@tiptap/pm/state";
import { Editor, textblockTypeInputRule } from "@tiptap/core";
import { codeBlockHighlightPlugin } from "./highlightPlugin";
import { getLanguageFeature, LanguageFeature } from "./LanguageFeature";

const options = {
  languageClassPrefix: "language-",
};

const name = "codeBlock";

export const CodeBlock = createReactBlockSpec(
  {
    type: name,
    propSchema: {
      language: {
        default: "python",
        parseHTML(element, getDefault) {
          const defaultValue = getDefault();
          if(defaultValue) return defaultValue;

          // fallback for previous CodeBlock
          const classNames = [...(element.firstElementChild?.classList || [])];
          const languages = classNames
            .filter((className) => className.startsWith(options.languageClassPrefix))
            .map((className) => className.replace(options.languageClassPrefix, ""));
          const language = languages[0];

          if(!language) {
            return null;
          }

          return language;
        },
      },
    },
    content: "inline",
    contentNoStyle: true,

    isCode: true,
    isIsolating: true,
    isDefining: true,

    customParseHTML() {
      return [
        { tag: "pre", preserveWhitespace: "full" },
      ];
    },

  },
  {
    globalKeyboardShortcuts: ({ type }) => ({
      "Tab": (editor) => editor._tiptapEditor.commands.command(({ state, tr }) => {
        const selection = state.selection;
        if(selection.$from.parent.type !== type) return false;
        if(selection.empty) {
          tr.insertText("\t");
        } else {
          const from = selection.$from;
          const { parentOffset, parentText, lineStart } = findLine(from);
          const to = selection.$to;
          if(from.sameParent(to)) return false;
          let index = lineStart;
          tr.insertText("\t", parentOffset + index);
          while (index <= to.pos) {
            if(
              isNewLine(parentText[index])
              && (index + 1 >= parentText.length || !isNewLine(parentText[index + 1]))
            ) {
              tr.insertText("\t", parentOffset + index + 1);
            }
            index++;
          }
        }
        return true;
      }),

      "Shift-Tab": (editor) => editor._tiptapEditor.commands.command(({ state, tr }) => {
        const selection = state.selection;
        if(selection.$from.parent.type !== type) return false;
        if(selection.empty) {
          const { parentText, parentOffset, lineStart } = findLine(state.selection.$from);
          if(parentText[lineStart] === "\t") {
            tr.replace(parentOffset + lineStart, parentOffset + lineStart + 1, Slice.empty);
          }
        } else {
          // Oh no this is NOT called when some text is selected
        }
        return true;
      }),

      "Mod-Alt-c": (editor) => {
        insertOrUpdateBlock(editor, { type: "codeBlock" });
        return true;
      },

      "Backspace": (editor) => {
        const tiptap = editor._tiptapEditor;
        const { empty, $anchor } = tiptap.state.selection;
        const isAtStart = $anchor.pos === 1;

        if(!empty || $anchor.parent.type !== type) {
          return false;
        }

        if(isAtStart || !$anchor.parent.textContent.length) {
          return tiptap.commands.clearNodes();
        }

        return false;
      },

      "Ctrl-Enter": (editor) => {
        const tiptap = editor._tiptapEditor;
        const anchor = tiptap.state.selection.$anchor;
        const codeBlock = anchor.parent;
        if(codeBlock.type != type) return false;

        // find end of line
        const { text, index, parentOffset } = traverseText(anchor);
        let i = index;
        while (i < text.length && !text[i].match(/\r|\n/)) i++;
        return insertNewLine(tiptap, getLanguageFeature(codeBlock.attrs.language), parentOffset + i);
      },

      "Enter": (editor) => {
        const tiptap = editor._tiptapEditor;
        const codeBlock = tiptap.state.selection.$anchor.parent;
        if(codeBlock.type !== type) return false;

        const { state } = tiptap;
        const { selection } = state;
        const { $from, empty } = selection;

        // exit node on triple enter
        const detectTripleEnter = () => {
          if(!empty) {
            return false;
          }

          const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
          const endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");

          if(!isAtEnd || !endsWithDoubleNewline) {
            return false;
          }

          return tiptap
            .chain()
            .command(({ tr }) => {
              tr.delete($from.pos - 2, $from.pos);

              return true;
            })
            .exitCode()
            .run();
        };

        return detectTripleEnter() || insertNewLine(tiptap, getLanguageFeature(codeBlock.attrs.language));
      },

      // exit node on arrow down
      "ArrowDown": (editor) => {
        const tiptap = editor._tiptapEditor;
        const { state } = tiptap;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if(!empty || $from.parent.type !== type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

        if(!isAtEnd) {
          return false;
        }

        const after = $from.after();

        if(after === undefined) {
          return false;
        }

        const nodeAfter = doc.nodeAt(after);

        if(nodeAfter) {
          return tiptap.commands.command(({ tr }) => {
            tr.setSelection(Selection.near(doc.resolve(after)));
            return true;
          });
        }

        return tiptap.commands.exitCode();
      },

      "Mod-a": (bnEditor) => bnEditor._tiptapEditor.commands.command(({ state, tr }) => {
        const selection = state.selection;
        if(selection.$anchor.parent.type === type && selection.$head.parent.type === type) {
          tr.setSelection(new AllSelection(tr.doc));
          return true;
        } else {
          return false;
        }
      }),
    }),

    inputRules: (info) => [
      textblockTypeInputRule({
        find: /^```([a-z]+)?[\s\n]$/,
        type: info.type,
        getAttributes: (match) => ({ language: match[1] }),
      }),
    ],

    render({ block, contentRef }) {
      return (
        <CodeBlockView
          language={block.props.language}
          setLanguage={(language) => block.props = { ...block.props, language }}
          contentRef={contentRef}
        />
      );
    },

    handlePaste(editor, event) {
      if(!event.clipboardData) {
        return false;
      }

      const tiptap = editor._tiptapEditor;
      // don’t create a new code block within code blocks
      if(tiptap.isActive(name)) {
        return false;
      }

      const text = event.clipboardData.getData("text/plain");
      const vscode = event.clipboardData.getData("vscode-editor-data");
      const vscodeData = vscode ? JSON.parse(vscode) : undefined;
      const language = vscodeData?.mode;

      if(!text || !language) {
        return false;
      }

      // create a code block with the text node
      // replace selection with the code block
      insertOrUpdateBlock(
        editor,
        { type: name,
          props: { language },
          content: [{ type: "text", styles: {}, text: text.replace(/\r\n?/g, "\n") }],
        },
      );

      return true;
    },

    proseMirrorPlugins: (info) => [codeBlockHighlightPlugin(info)],
  },
);

function traverseText(pos: ResolvedPos) {
  const parentOffset = pos.posAtIndex(0);
  return {
    text: pos.parent.textContent,
    index: pos.pos - parentOffset,
    parentOffset,
  };
}

function findLine(selection: ResolvedPos, separator: (c: string) => boolean = (c) => !!c.match(/\r|\n/)) {
  const parent = selection.parent;
  console.assert(parent.type.name === name, `expected blockName(${name}) == parent(${parent.type.name})`);
  const parentOffset = selection.posAtIndex(0);
  const selectionPos = selection.pos - parentOffset;
  let index = selectionPos;
  const text = parent.textContent;
  while (index > 0 && !separator(text[index - 1])) {
    index--;
  }
  return {
    parent,
    parentText: text,
    parentOffset,
    pos: selection.pos,
    posInParent: selectionPos,
    lineStart: index,
    content: text.slice(index, selectionPos),
  };
}

function isNewLine(c: string) {
  return !!c.match(/\r|\n/);
}

function insertNewLine(tiptap: Editor, feature: LanguageFeature, position?: number) {
  return tiptap.commands.command(({ state, tr }) => {
    const selection = state.selection.$anchor;
    const line = findLine(selection).content;
    let indentEnd = 0;
    while (indentEnd < line.length) {
      if(!line[indentEnd].match(/\s/)) break;
      indentEnd++;
    }
    const delta = feature.increaseIndent(line);
    let indent = line.slice(0, indentEnd);
    if(delta > 0) {
      for(let i = 0; i < delta; i++) indent += "\t";
    } else if(delta < 0) {
      for(let i = -delta; i > 0; i--) {
        if(indent.endsWith("\t")) {
          indent = indent.slice(0, indent.length - 2);
        } else {
          break;
        }
      }
    }

    const text = "\n" + indent;
    tr.insertText(text, position ?? selection.pos);
    if(position) {
      tr.setSelection(new TextSelection(tr.doc.resolve(position + text.length)));
    }
    return true;
  });
};
