import { insertOrUpdateBlock } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useState, useEffect } from "react";
import { MathInputDropdown } from "./MathInputDropdown";
import { useMathView, MathView } from "./MathView";

export const MathBlock = createReactBlockSpec({
  type: "mathBlock",
  content: "none",
  propSchema: {
    value: {
      default: "",
    },
    opened: {
      default: false,
    },
  },
}, {
  globalKeyboardShortcuts: () => ({
    "Ctrl-Shift-E": (editor) => {
      // type error of this is definitely bug; why Prettify<typeof editor.schema.blockSchema> works
      insertOrUpdateBlock(editor as any, { type: "mathBlock" });
      return true;
    },
  }),
  render({ block, editor }) {
    const { props } = block;
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
          block.remove();
        } else {
          block.props = { ...block.props, opened: false, value: content };
          setCloseDirection(direction ?? "right");
        }
      }
      _setOpened(value);
    };

    useEffect(() => {
      if(closeDirection) {
        editor._tiptapEditor.commands.focus(
          closeDirection === "left" ? block.pos : block.pos + block._pmNode.nodeSize,
        );
        setCloseDirection(null);
      }
    }, [closeDirection]);

    const math = useMathView(opened ? content : props.value, { editing: opened, displayMode: true });

    return (
      <MathInputDropdown
        opened={opened}
        setOpened={setOpened}
        content={content}
        error={math.error ?? null}
        onChange={setContent}
        strings={{ placeholder: "E = mc^2" }}
        onEnter={(value, direction) => {
          console.assert(content === value, "%s != %s", content, value);
          setOpened(false, direction);
        }}
      >
        <div
          onClick={() => setOpened(true)}
          onDragStart={(event) => {
            if(editor._tiptapEditor.state.selection.empty) {
              event.preventDefault();
            }
          }}
        >
          <MathView result={math} />
        </div>
      </MathInputDropdown>
    );
  },
});
