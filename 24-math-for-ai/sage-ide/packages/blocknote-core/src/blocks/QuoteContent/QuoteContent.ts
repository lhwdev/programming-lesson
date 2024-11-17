import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from "../../schema";
import { BlockGroup } from "../../pm-nodes";

export const QuoteBlockGroup = BlockGroup
  .extend({ name: "quoteBlockGroup" })
  .configure({
    domAttributes: {
      blockGroup: {
        class: "bn-quote",
      },
    },
    nested: false,
  });

export const QuoteContent = createStronglyTypedTiptapNode({
  name: "quote",
  content: "",
  group: "blockContent",

  blockExtra: {
    createBlockGroup(schema, children) {
      return schema.nodes[QuoteBlockGroup.name].create(null, children);
    },
  },

  addExtensions() {
    return [QuoteBlockGroup];
  },

  renderHTML() {
    return ["div", { class: "bn-quote-content" }];
  },
});

export const Quote = createBlockSpecFromStronglyTypedTiptapNode(
  QuoteContent,
  {},
);
