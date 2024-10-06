import { MathView, useMathView } from "./MathView";
import { MathInputDropdown } from "./MathInputDropdown";
import { useEffect, useState } from "react";
import { createReactInlineContentSpec } from "@blocknote/react";

export const MathInline = createReactInlineContentSpec(
  {
    type: "mathInline",
    propSchema: {
      value: {
        default: "",
      },
      opened: {
        default: false,
      },
    },
    content: "none",
  }, {
    globalKeyboardShortcuts: ({ type }) => ({
      "Ctrl-Shift-E": (editor) => {
        editor.insertInlineContent([{ type: "mathInline" }]);
        return true;
      },

      "ArrowLeft": (editor) => {
        const anchor = editor._tiptapEditor.state.selection.$anchor;
        console.log("AL", anchor.textOffset, anchor.nodeBefore);
        if(anchor.textOffset === 0) {
          const candidate = anchor.nodeBefore;
          if(candidate?.type === type) {
            return editor._tiptapEditor.commands.command(({ tr }) => {
              tr.setNodeMarkup(anchor.pos - candidate.nodeSize, null, { ...candidate.attrs, opened: true });
              return true;
            });
          }
        }
        return false;
      },

      "ArrowRight": (editor) => {
        const anchor = editor._tiptapEditor.state.selection.$anchor;
        if(anchor.textOffset === 0) {
          const candidate = anchor.nodeAfter;
          if(candidate?.type === type) {
            return editor._tiptapEditor.commands.command(({ tr }) => {
              tr.setNodeMarkup(anchor.pos, null, { opened: true });
              return true;
            });
          }
        }
        return false;
      },
    }),
    render({ inlineContent, node, editor }) {
      const { props } = inlineContent;
      const [_opened, _setOpened] = useState(props.value === "");
      const [closeDirection, setCloseDirection] = useState<"left" | "right" | null>(null);
      const [content, setContent] = useState(props.value);
      const opened = _opened || props.opened;
      const setOpened = (value: boolean, direction?: "left" | "right") => {
        if(value) {
          setContent(props.value);
        } else {
          if(content === "") {
            // Remove current node
            node.remove();
          } else {
            node.props = { ...node.props, opened: false, value: content };
            setCloseDirection(direction ?? "right");
          }
        }
        _setOpened(value);
      };

      useEffect(() => {
        if(closeDirection) {
          editor._tiptapEditor.commands.focus(
            closeDirection === "left" ? node.pos : node.pos + node._pmNode.nodeSize,
          );
          setCloseDirection(null);
        }
      }, [closeDirection]);

      const math = useMathView(opened ? content : props.value, { displayMode: false });

      return (
        <MathInputDropdown
          opened={opened}
          setOpened={setOpened}
          content={content}
          onChange={setContent}
          strings={{ placeholder: "E = mc^2" }}
          onEnter={(value, direction) => {
            console.assert(content === value, "%s != %s", content, value);
            setOpened(false, direction);
          }}
        >
          <MathView result={math} />
        </MathInputDropdown>
      );
    },
  },
);
