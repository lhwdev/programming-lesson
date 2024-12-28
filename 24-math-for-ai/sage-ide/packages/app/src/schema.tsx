import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs, insertOrUpdateBlock } from "@blocknote/core";
import { RiBox1Fill, RiCalculatorFill, RiCalculatorLine, RiCodeFill } from "react-icons/ri";
import { Alert } from "./nodes/Alert";
import { FormattingToolbar, getDefaultReactSlashMenuItems, getFormattingToolbarItems, useBlockNoteEditor, useComponentsContext } from "@blocknote/react";
import { MathInline } from "./nodes/math/MathInline";
import { CodeInline } from "./nodes/codeInline/CodeInline";
import { ReactNode } from "react";
import { CodeBlock } from "./nodes/codeBlock/CodeBlock";
import { MathBlock } from "./nodes/math/MathBlock";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,

    alert: Alert,
    codeBlock: CodeBlock,
    mathBlock: MathBlock,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mathInline: MathInline,
  },
  styleSpecs: {
    // Note: Order matters. When multiple styles are applied, styles that come first become parent.
    codeInline: CodeInline,
    ...defaultStyleSpecs,
  },
});

export type Schema = typeof schema;

export function allSlashMenuItems(editor: typeof schema.BlockNoteEditor) {
  const dictionary = editor.dictionary;
  const group = {
    advanced: dictionary.slash_menu.table.group,
  };
  const all = [
    ...getDefaultReactSlashMenuItems(editor)
      .filter((item) => (item as any).key !== "emoji"),
    {
      title: "박스",
      subtext: "경고, 정보, 알림과 같은 정보를 표시합니다.",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "alert" });
      },
      aliases: [
        "박스",
        "box",
        "알림",
        "notification",
        "warning",
        "error",
        "info",
        "success",
      ],
      group: group.advanced,
      icon: <RiBox1Fill />,
    },
    {
      title: "수식",
      subtext: "본문 중간에 수식을 추가합니다.",
      onItemClick: () => {
        editor.insertInlineContent([{ type: "mathInline" }]);
      },
      aliases: [
        "수식",
        "수학",
        "math",
        "latex",
        "katex",
      ],
      group: group.advanced,
      icon: <RiCalculatorLine />,
    },
    {
      title: "수식 블럭",
      subtext: "수식 상자를 추가합니다.",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "mathBlock" });
      },
      aliases: [
        "수식 블럭",
        "수학",
        "mathBlock",
        "latex",
        "katex",
      ],
      group: group.advanced,
      icon: <RiCalculatorFill />,
    },
    {
      title: "코드",
      subtext: "코드 블럭을 추가합니다.",
      onItemClick: () => {
        insertOrUpdateBlock(editor, { type: "codeBlock", props: { language: "python" } });
      },
      aliases: [
        "코드",
        "code",
      ],
      group: group.advanced,
      icon: <RiCodeFill />,
    },
  ];
  const grouped = new Map();
  for(const item of all) {
    let group = grouped.get(item.group);
    if(!group) {
      group = [];
      grouped.set(item.group, group);
    }
    group.push(item);
  }
  const result = [];
  for(const group of grouped.values()) {
    result.push(...group);
  }
  return result;
}

export function MyFormattingToolbar() {
  const editor = useBlockNoteEditor();
  const insideBlock = editor.isInsideBlock();
  return (
    <FormattingToolbar>
      {getFormattingToolbarItems(undefined, insideBlock)}

      {/* <Code */}
      <ToggleStyleButton
        name="codeInline"
        label="코드"
        shortcut="Ctrl+E"
        icon={<RiCodeFill />}
      />
    </FormattingToolbar>
  );
}

function ToggleStyleButton({ name, label, shortcut, icon }: {
  name: keyof (typeof schema)["styleSchema"];
  label: string;
  shortcut?: string;
  icon: ReactNode;
}) {
  const editor = useBlockNoteEditor(schema);

  const Components = useComponentsContext()!;

  return (
    <Components.FormattingToolbar.Button
      label={label}
      mainTooltip={label}
      secondaryTooltip={shortcut}
      icon={icon}
      isSelected={editor.getActiveStyles()[name] === true}
      onClick={() => {
        editor.toggleStyles({ [name]: true });
      }}
    />
  );
}
