import { MathView, useMathView } from "./MathView";
import { MathInputDropdown } from "./MathInputDropdown";
import { useState } from "react";
import { createReactInlineContentSpec } from "@blocknote/react";

export const MathInline = createReactInlineContentSpec(
  {
    type: "mathInline",
    propSchema: {
      value: {
        default: "",
      },
    },
    content: "none",
  }, {
    globalKeyboardShortcuts: {
      "Ctrl-Shift-E": (editor) => {
        editor.insertInlineContent([{ type: "mathInline" }]);
        return true;
      },
    },
    render({ inlineContent, node }) {
      const { props } = inlineContent;
      const [opened, _setOpened] = useState(props.value === "");
      const [content, setContent] = useState(props.value);
      const setOpened = (value: boolean) => {
        if(value) {
          setContent(props.value);
        } else {
          if(content === "") {
            // Remove current node
            node.remove();
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
              node.props = { ...props, value };
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
