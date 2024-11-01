import { Node } from "@tiptap/core";
import { BlockNoteDOMAttributes } from "../schema";
import { mergeCSSClasses } from "../util/browser";
import { NodeType } from "prosemirror-model";
import { isNodeInGroup } from "../util/nodeType";

export const BlockGroup = Node.create<{
  domAttributes?: BlockNoteDOMAttributes;
}>({
  name: "blockGroup",
  group: "blockGroup nestBlockGroup",
  content: "blockContainer+",

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          if(typeof element === "string") {
            return false;
          }

          if(element.getAttribute("data-node-type") === "blockGroup") {
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
      "bn-nest-block-group",
      blockGroupHTMLAttributes.class,
    );
    blockGroup.setAttribute("data-node-type", "blockGroup");
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
  return isNodeInGroup(type, "blockGroup");
}

export function isNestBlockGroup(type: NodeType) {
  return isNodeInGroup(type, "nestBlockGroup");
}
