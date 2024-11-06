import { Node } from "@tiptap/core";

export const StubBlock = Node.create({
  name: "stubBlock",
  content: "",
  group: "blockContent",

  renderHTML(props) {
    return { dom: document.createElement("span") };
  },
});
