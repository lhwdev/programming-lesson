import { createReactBlockSpec } from "@blocknote/react";
import katex from "katex";

export const MathInline = createReactBlockSpec(
  {
    type: "math_inline",
    propSchema: {
      value: {
        default: "",
      },
    },
    content: "none",
  }, {
    render({ editor }) {

    },
  },
);

function MathInlineView({ value }: { value: string }) {
  const { html, error };
}
