import { Node as PMNode } from "prosemirror-model";
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from "../../schema";
import { Node } from "@tiptap/core";
import { EditorState } from "prosemirror-state";
import { mergeCSSClasses } from "../../util/browser";
import { defaultProps } from "../defaultProps";

const propSchema = {
  ...defaultProps,
};

export const BlockColumnContent = createStronglyTypedTiptapNode({
  name: "blockColumn",
  content: "inline*",
  group: "blockContent",

  createBlockGroup(state: EditorState, children: PMNode[]): PMNode {
    return state.schema.nodes[ColumnBlockGroup.name].create(null, children);
  },

  renderHTML() {
    return ["div", { class: "this-is-column" }, 0];
  },
});

export const BlockColumn = createBlockSpecFromStronglyTypedTiptapNode(BlockColumnContent, propSchema);

export const ColumnBlockGroup = Node.create({
  name: "columnBlockGroup",
  group: "blockGroup",
  content: "blockContainer+",

  renderHTML({ HTMLAttributes }) {
    const blockGroupHTMLAttributes = {
      // ...(this.options.domAttributes?.blockGroup || {}),
      ...HTMLAttributes,
    };
    const blockGroup = document.createElement("div");
    blockGroup.className = mergeCSSClasses(
      "bn-block-group",
      "bn-column-block-group",
      blockGroupHTMLAttributes.class,
    );
    blockGroup.setAttribute("data-node-type", "columnBlockGroup");
    for(const [attribute, value] of Object.entries(blockGroupHTMLAttributes)) {
      if(attribute !== "class") {
        blockGroup.setAttribute(attribute, value);
      }
    }

    return {
      dom: blockGroup,
      contentDOM: blockGroup,
    };
  },
});
