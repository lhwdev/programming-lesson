import { createReactInlineContentSpec } from "@blocknote/react";
import { useMathView } from "./MathView";
import { MathInputDropdown } from "./MathInputDropdown";

export const MathInline = createReactInlineContentSpec(
  {
    type: "math_inline",
    propSchema: {
      value: {
        default: "E = mc^2",
      },
      isInitialized: {
        default: false,
      },
    },
    content: "none",
  }, {
    render({ inlineContent, updateInlineContent }) {
      const { props } = inlineContent;

      return (
        <MathInputDropdown
          value={props.value}
          strings={{ placeholder: "E = mc^2" }}
          onValueChange={(value) => updateInlineContent({ ...inlineContent, props: { ...props, value } })}
        >
          <MathInlineView tex={props.value} />
        </MathInputDropdown>
      );
    },
  },
);

function MathInlineView({ tex }: { tex: string }) {
  const { node, error } = useMathView(tex, { displayMode: false });
  return node ?? <span>{error.message}</span>;
}
