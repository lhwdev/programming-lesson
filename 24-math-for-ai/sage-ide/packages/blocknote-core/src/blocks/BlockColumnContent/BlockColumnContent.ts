import { Fragment, Node as PMNode, Schema } from "prosemirror-model";
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from "../../schema";
import { Node } from "@tiptap/core";
import { mergeCSSClasses } from "../../util/browser";
import { defaultProps } from "../defaultProps";

const propSchema = {
  ...defaultProps,
};

export const BlockColumnContent = createStronglyTypedTiptapNode({
  name: "blockColumn",
  content: "inline*",
  group: "blockContent",

  blockExtra: {
    createBlockGroup(schema: Schema, children: Fragment): PMNode {
      return schema.nodes[ColumnBlockGroup.name].create(null, children);
    },
  },

  renderHTML() {
    return ["div", { class: "this-is-column" }, 0];
  },
});

export const BlockColumn = createBlockSpecFromStronglyTypedTiptapNode(BlockColumnContent, propSchema);

export const ColumnBlockGroup = Node.create({
  name: "columnBlockGroup",
  group: "anyBlockGroup",
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
