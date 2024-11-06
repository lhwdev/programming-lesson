import { createBlockSpec } from "../../schema";

export const Quote = createBlockSpec({
  type: "quote",
  content: "none",
  blockContent: true,
  propSchema: {},
}, {
  render(_block, _editor) {
    const dom = document.createElement("span");
    dom.hidden = true;
    return { dom };
  },
});
