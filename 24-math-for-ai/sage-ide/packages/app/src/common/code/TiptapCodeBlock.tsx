import { mergeAttributes, Node as TiptapNode, textblockTypeInputRule } from "@tiptap/core";
import { ResolvedPos, Slice } from "@tiptap/pm/model";
import {
  Plugin,
  PluginKey,
  Selection,
  TextSelection,
} from "@tiptap/pm/state";
import clsx from "clsx";
import "./TiptapCodeBlock.css";

export interface CodeBlockOptions {
  /**
   * Uses to make this code block root node.
   * In fact this effectively becomes a single child of Document.
   */
  root: boolean;

  enterAction: (() => boolean) | null;

  /**
   * Adds a prefix to language classes that are applied to code tags.
   * @default 'language-'
   */
  languageClassPrefix: string;
  /**
   * Define whether the node should be exited on triple enter.
   * @default true
   */
  exitOnTripleEnter: boolean;
  /**
   * Define whether the node should be exited on arrow down if there is no node after it.
   * @default true
   */
  exitOnArrowDown: boolean;
  /**
   * The default language.
   * @default null
   * @example 'js'
   */
  defaultLanguage: string | null | undefined;
  /**
   * Custom HTML attributes that should be added to the rendered HTML tag.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeBlock: {
      /**
       * Set a code block
       * @param attributes Code block attributes
       * @example editor.commands.setCodeBlock({ language: 'javascript' })
       */
      setCodeBlock: (attributes?: { language: string }) => ReturnType;
      /**
       * Toggle a code block
       * @param attributes Code block attributes
       * @example editor.commands.toggleCodeBlock({ language: 'javascript' })
       */
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType;
    };
  }
}

/**
 * Matches a code block with backticks.
 */
export const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;

/**
 * Matches a code block with tildes.
 */
export const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

/**
 * This extension allows you to create code blocks.
 * @see https://tiptap.dev/api/nodes/code-block
 */
export const CodeBlock = TiptapNode.create<CodeBlockOptions>({
  name: "codeBlock",

  addOptions() {
    return {
      root: false,
      enterAction: null,
      languageClassPrefix: "language-",
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: null,
      HTMLAttributes: {},
    };
  },

  content: "text*",

  marks: "",

  group: "block",

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: (element) => {
          const { languageClassPrefix } = this.options;
          const classNames = [...(element.firstElementChild?.classList || [])];
          const languages = classNames
            .filter((className) => className.startsWith(languageClassPrefix))
            .map((className) => className.replace(languageClassPrefix, ""));
          const language = languages[0];

          if(!language) {
            return null;
          }

          return language;
        },
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        "code",
        {
          class: clsx(
            node.attrs.language
              ? this.options.languageClassPrefix + node.attrs.language
              : null,
            "pm-code-block",
          ),
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes) => ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleCodeBlock:
        (attributes) => ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph", attributes);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Tab": () => this.editor.commands.command(({ state, tr }) => {
        if(state.selection.empty) {
          tr.insertText("\t");
        } else {
          const from = state.selection.$from;
          const { parentOffset, parentText, lineStart } = findLine(this.name, from);
          const to = state.selection.to;
          let index = lineStart;
          tr.insertText("\t", parentOffset + index);
          while (index <= to) {
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

      "Shift-Tab": () => this.editor.commands.command(({ state, tr }) => {
        if(state.selection.empty) {
          const { parentText, parentOffset, lineStart } = findLine(this.name, state.selection.$from);
          if(parentText[lineStart] === "\t") {
            tr.replace(parentOffset + lineStart, parentOffset + lineStart + 1, Slice.empty);
          }
        } else {
          // Oh no this is NOT called when some text is selected
        }
        return true;
      }),

      "Mod-Alt-c": () => {
        if(this.options.root) return false;
        return this.editor.commands.toggleCodeBlock();
      },

      // remove code block when at start of document or code block is empty
      "Backspace": () => {
        if(this.options.root) return false;

        const { empty, $anchor } = this.editor.state.selection;
        const isAtStart = $anchor.pos === 1;

        if(!empty || $anchor.parent.type.name !== this.name) {
          return false;
        }

        if(isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes();
        }

        return false;
      },

      "Shift-Enter": ({ editor }) => {
        if(this.options.enterAction) {
          return editor.commands.command(({ tr }) => {
            tr.insertText("\n");
            return true;
          });
        } else {
          return false;
        }
      },

      "Enter": ({ editor }) => {
        if(this.options.enterAction?.()) return true;

        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        const newLine = () => {
          return editor.commands.command(({ state, tr }) => {
            const selection = state.selection.$from;
            const line = findLine(this.name, selection).content;
            let indentEnd = 0;
            while (indentEnd < line.length) {
              if(!line[indentEnd].match(/\s/)) break;
              indentEnd++;
            }
            tr.insertText("\n" + line.slice(0, indentEnd), selection.pos);
            return true;
          });
        };

        // exit node on triple enter
        const detectTripleEnter = () => {
          if(!this.options.exitOnTripleEnter || this.options.root) {
            return false;
          }

          if(!empty || $from.parent.type !== this.type) {
            return false;
          }

          const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
          const endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");

          if(!isAtEnd || !endsWithDoubleNewline) {
            return false;
          }

          return editor
            .chain()
            .command(({ tr }) => {
              tr.delete($from.pos - 2, $from.pos);

              return true;
            })
            .exitCode()
            .run();
        };

        return detectTripleEnter() || newLine();
      },

      // exit node on arrow down
      "ArrowDown": ({ editor }) => {
        if(!this.options.exitOnArrowDown || this.options.root) {
          return false;
        }

        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if(!empty || $from.parent.type !== this.type) {
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
          return editor.commands.command(({ tr }) => {
            tr.setSelection(Selection.near(doc.resolve(after)));
            return true;
          });
        }

        return editor.commands.exitCode();
      },
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      // this plugin creates a code block for pasted content from VS Code
      // we can also detect the copied code language
      new Plugin({
        key: new PluginKey("codeBlockVSCodeHandler"),
        props: {
          handlePaste: (view, event) => {
            if(!event.clipboardData) {
              return false;
            }

            // don’t create a new code block within code blocks
            if(this.editor.isActive(this.type.name)) {
              return false;
            }

            const text = event.clipboardData.getData("text/plain");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const vscodeData = vscode ? JSON.parse(vscode) : undefined;
            const language = vscodeData?.mode;

            if(!text || !language) {
              return false;
            }

            const { tr, schema } = view.state;

            // prepare a text node
            // strip carriage return chars from text pasted as code
            // see: https://github.com/ProseMirror/prosemirror-view/commit/a50a6bcceb4ce52ac8fcc6162488d8875613aacd
            const textNode = schema.text(text.replace(/\r\n?/g, "\n"));

            // create a code block with the text node
            // replace selection with the code block
            tr.replaceSelectionWith(this.type.create({ language }, textNode));

            if(tr.selection.$from.parent.type !== this.type) {
              // put cursor inside the newly created code block
              tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, tr.selection.from - 2))));
            }

            // store meta information
            // this is useful for other plugins that depends on the paste event
            // like the paste rule plugin
            tr.setMeta("paste", true);

            view.dispatch(tr);

            return true;
          },
        },
      }),
    ];
  },
});

function findLine(blockName: string, selection: ResolvedPos, separator: (c: string) => boolean = (c) => !!c.match(/\r|\n/)) {
  const parent = selection.parent;
  console.assert(parent.type.name === blockName, `expected blockName(${blockName}) == parent(${parent.type.name})`);
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
