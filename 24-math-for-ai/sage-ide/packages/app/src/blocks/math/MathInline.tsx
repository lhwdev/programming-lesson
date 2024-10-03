import { MathView, useMathView } from "./MathView";
import { MathInputDropdown } from "./MathInputDropdown";
import { useState } from "react";
import { createReactInlineContentSpec, useBlockNoteEditor } from "@blocknote/react";

export const MathInline = createReactInlineContentSpec(
  {
    type: "math_inline",
    propSchema: {
      value: {
        default: "",
      },
    },
    content: "none",
  }, {
    render({ inlineContent, updateInlineContent }) {
      const { props } = inlineContent;
      const editor = useBlockNoteEditor();
      const [opened, _setOpened] = useState(props.value === "");
      const [content, setContent] = useState(props.value);
      const setOpened = (value: boolean) => {
        if(value) {
          setContent(props.value);
        } else {
          if(content === "") {
            // Remove current node
            // See https://github.com/TypeCellOS/BlockNote/blob/4597f0219d472b9e6c55e572853a252b2e1b224b/packages/react/src/schema/ReactInlineContentSpec.tsx#L177
            editor._tiptapEditor.view.dispatch(
              editor._tiptapEditor.view.state.tr.replace(props),
            );
          }
        }
        _setOpened(value);
      };

      const math = useMathView(opened ? content : props.value, { displayMode: false });

      return (
        <MathInputDropdown
          opened={opened}
          setOpened={setOpened}
          content={content}
          onChange={setContent}
          strings={{ placeholder: "E = mc^2" }}
          onEnter={(value) => {
            console.assert(content === value, "%s != %s", content, value);
            if(value !== "") {
              updateInlineContent({ ...inlineContent, props: { ...props, value } });
            }
            setOpened(false);
          }}
        >
          <MathView result={math} />
        </MathInputDropdown>
      );
    },
  },
);
