import { Node } from "@tiptap/core";
import { BlockNoteDOMAttributes } from "../schema";
import { mergeCSSClasses } from "../util/browser";
import { NodeType } from "prosemirror-model";
import { isNodeInGroup } from "../util/nodeType";

export const BlockGroup = Node.create<{
  domAttributes?: BlockNoteDOMAttributes;
  nested?: boolean;
}>({
  name: "blockGroup",

  addOptions() {
    return { nested: true };
  },

  group() {
    return this.options.nested ? "anyBlockGroup nestBlockGroup" : "anyBlockGroup";
  },
  content: "blockContainer+",

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          if(typeof element === "string") {
            return false;
          }

          if(element.getAttribute("data-node-type") === this.name) {
            // Null means the element matches, but we don't want to add any attributes to the node.
            return null;
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const blockGroupHTMLAttributes = {
      ...(this.options.domAttributes?.blockGroup || {}),
      ...HTMLAttributes,
    };
    const blockGroup = document.createElement("div");
    blockGroup.className = mergeCSSClasses(
      "bn-block-group",
      this.options.nested ? "bn-nest-block-group" : null,
      blockGroupHTMLAttributes.class,
    );
    blockGroup.setAttribute("data-node-type", this.name);
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

export function isBlockGroup(type: NodeType) {
  return isNodeInGroup(type, "anyBlockGroup");
}

export function isNestBlockGroup(type: NodeType) {
  return isNodeInGroup(type, "nestBlockGroup");
}
