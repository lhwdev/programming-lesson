import { Node } from "@tiptap/core";
import { FootnoteRules } from "./FootnoteRules";
import { BlockExtra } from "../../pm-nodes/BlockContainer";

export const FootnotesContent = Node.create({
  name: "footnotes",

  isolating: true,
  defining: true,
  draggable: false,

  content: "footnote*",

  blockExtra: {
    placeholder: "격주의 내용을 입력하세요.",
  } satisfies BlockExtra,

  parseHTML() {
    return [
      {
        tag: "div.footnotes",
        priority: 1000,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, class: "bn-footnotes" }, 0];
  },

  addKeyboardShortcuts() {
    return {
      // override the default behavior of Mod-a:
      // rather than selecting the whole text content of the editor, only select the text inside the current footnote
      "Mod-a": ({ editor }) => {
        try {
          const { selection } = editor.state;
          const { $from } = selection;
          // footnote listItems are at depth 2, we are getting the start & end position of the parent list item from the current cursor position
          const start = $from.start(2);
          const startNode = editor.$pos(start);

          if(startNode.node.type.name != "footnote") return false;

          const end = $from.end(2);

          editor.commands.setTextSelection({
            from: start + 1,
            to: end - 1,
          });
          return true;
        } catch (_) {
          return false;
        }
      },
    };
  },
  addCommands() {
    return {};
  },
  addInputRules() {
    return [];
  },

  addExtensions() {
    return [FootnoteRules];
  },
});
