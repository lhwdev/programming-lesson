import classes from "./CodeBlock.module.css";
import { CodeBlockShiki } from "@/common/code/TiptapCodeBlockShiki";
import { createBlockSpecFromStronglyTypedTiptapNode } from "@blocknote/core";

export const CodeBlock = createBlockSpecFromStronglyTypedTiptapNode(
  CodeBlockShiki
    .extend({ name: "codeBlock", content: "inline*", group: "blockContent" })
    .configure({ HTMLAttributes: { class: classes.codeBlock } }),
  {
    language: {
      default: "python",
    },
  },
);
