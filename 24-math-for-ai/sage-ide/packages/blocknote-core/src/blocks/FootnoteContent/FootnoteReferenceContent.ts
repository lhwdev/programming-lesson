import { mergeAttributes } from "@tiptap/core";
import { NodeSelection, Plugin, PluginKey } from "prosemirror-state";
import UniqueID from "../../extensions/UniqueID/UniqueID";
import { createInlineContentSpecFromTipTapNode, createStronglyTypedTiptapNode } from "../../schema";

const RefNumberAttr = "data-reference-number";
const RefClass = "bn-footnote-reference";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnoteReference: {
      /**
       * add a new footnote reference
       * @example editor.commands.addFootnote()
       */
      addFootnote(): ReturnType;
    };
  }
}

export const FootnoteReferenceContent = createStronglyTypedTiptapNode({
  name: "footnoteReference",
  inline: true,
  content: "inline*",
  group: "inline",
  atom: true,
  draggable: true,

  parseHTML() {
    return [
      {
        tag: `sup a.${RefClass}`,
        priority: 1000,
      },
    ];
  },

  addAttributes() {
    return {
      id: {
        isRequired: true,
      },
      referenceNumber: {
        parseHTML(element) {
          return element.getAttribute(RefNumberAttr) || element.innerText;
        },
      },
    };
  },

  renderHTML({ node }) {
    const { id, referenceNumber } = node.attrs;
    const attrs = mergeAttributes(this.options.HTMLAttributes, {
      "class": RefClass,
      [RefNumberAttr]: referenceNumber,
      "data-id": id,
      "href": `#fn:${referenceNumber}`,
    });

    return [
      "sup",
      { id: `fnref:${referenceNumber}` },
      ["a", attrs, `${referenceNumber}`],
    ];
  },

  addExtensions() {
    return [
      UniqueID.extend({ name: "unique_id:footnote" }).configure({ attributeName: "id" }),
    ];
  },

  addProseMirrorPlugins() {
    const { editor, type } = this;
    const footnoteRefClick = new Plugin({
      key: new PluginKey("footnoteRefClick"),

      props: {
        // on double-click, focus on the footnote
        handleDoubleClickOn(_view, _pos, node, _nodePos, event) {
          if(node.type !== type) return false;
          event.preventDefault();
          const id = node.attrs.id;
          return editor.commands.focusFootnote(id);
        },
        // click the footnote reference once to get focus, click twice to scroll to the footnote
        handleClickOn(_view, _pos, node, nodePos, event) {
          if(node.type !== type) return false;
          event.preventDefault();
          const { selection } = editor.state.tr;
          if(selection instanceof NodeSelection && selection.node.eq(node)) {
            const id = node.attrs.id;
            return editor.commands.focusFootnote(id);
          } else {
            editor.chain().setNodeSelection(nodePos).run();
            return true;
          }
        },
      },
    });

    return [footnoteRefClick];
  },

  addCommands() {
    return {
      addFootnote: () => ({ state, tr }) => {
        const node = this.type.create();
        tr.insert(state.selection.anchor, node);
        return true;
      },
    };
  },

  addInputRules() {
    // when a user types [^text], add a new footnote
    return [
      {
        find: /\[\^(.*?)\]/,
        type: this.type,
        handler({ range, match, chain }) {
          const start = range.from;
          const end = range.to;
          if(match[1]) {
            chain().deleteRange({ from: start, to: end }).addFootnote().run();
          }
        },
      },
    ];
  },
});

export const FootnoteReference = createInlineContentSpecFromTipTapNode(
  FootnoteReferenceContent,
  {
    id: { default: "" },
  },
);
