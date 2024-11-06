import { Node } from "@tiptap/core";
import { Node as PMNode } from "prosemirror-model";

interface DocAttributes {
  content: string;
}

export const Doc = Node.create<DocAttributes>({
  name: "doc",
  topNode: true,
  content() { return this.options.content; },

  addOptions() {
    return {
      content: "blockGroup",
    };
  },
});

export function getRootGroup(doc: PMNode) {
  return doc.firstChild!;
}
