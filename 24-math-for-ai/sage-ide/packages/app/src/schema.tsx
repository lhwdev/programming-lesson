import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs, insertOrUpdateBlock } from "@blocknote/core";
import { RiBox1Fill, RiCalculatorFill, RiCodeFill } from "react-icons/ri";
import { Alert } from "./blocks/Alert";
import { BasicTextStyleButton, BlockTypeSelect, ColorStyleButton, CreateLinkButton, FileCaptionButton, FileReplaceButton, FormattingToolbar, getDefaultReactSlashMenuItems, NestBlockButton, TextAlignButton, UnnestBlockButton, useBlockNoteEditor, useComponentsContext } from "@blocknote/react";
import { MathInline } from "./blocks/math/MathInline";
import { CodeInline } from "./inlines/CodeInline";
import { ReactNode } from "react";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,

    alert: Alert,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    math_inline: MathInline,
  },
  styleSpecs: {
    ...defaultStyleSpecs,
    code_inline: CodeInline,
  },
});

export function allSlashMenuItems(editor: typeof schema.BlockNoteEditor) {
  const dictionary = editor.dictionary;
  const group = {
    advanced: dictionary.slash_menu.table.group,
  };
  const all = [
    ...getDefaultReactSlashMenuItems(editor),
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
        editor.insertInlineContent([{ type: "math_inline" }]);
      },
      aliases: [
        "수식",
        "수학",
        "math",
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
        // TODO
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
  for (const item of all) {
    let group = grouped.get(item.group);
    if (!group) {
      group = [];
      grouped.set(item.group, group);
    }
    group.push(item);
  }
  const result = [];
  for (const group of grouped.values()) {
    result.push(...group);
  }
  return result;
}

export function MyFormattingToolbar() {
  return (
    <FormattingToolbar>
      <BlockTypeSelect key="blockTypeSelect" />

      <FileCaptionButton key="fileCaptionButton" />
      <FileReplaceButton key="replaceFileButton" />

      <BasicTextStyleButton
        basicTextStyle="bold"
        key="boldStyleButton"
      />
      <BasicTextStyleButton
        basicTextStyle="italic"
        key="italicStyleButton"
      />
      <BasicTextStyleButton
        basicTextStyle="underline"
        key="underlineStyleButton"
      />
      <BasicTextStyleButton
        basicTextStyle="strike"
        key="strikeStyleButton"
      />

      <TextAlignButton
        textAlignment="left"
        key="textAlignLeftButton"
      />
      <TextAlignButton
        textAlignment="center"
        key="textAlignCenterButton"
      />
      <TextAlignButton
        textAlignment="right"
        key="textAlignRightButton"
      />

      <ColorStyleButton key="colorStyleButton" />

      <NestBlockButton key="nestBlockButton" />
      <UnnestBlockButton key="unnestBlockButton" />

      <CreateLinkButton key="createLinkButton" />

      <ToggleStyleButton
        name="code_inline"
        label="코드"
        icon={<RiCodeFill />}
      />

      {/* <Code */}
    </FormattingToolbar>
  );
}

function ToggleStyleButton({ name, label, icon }: {
  name: keyof (typeof schema)["styleSchema"];
  label: string;
  icon: ReactNode;
}) {
  const editor = useBlockNoteEditor(schema);

  const Components = useComponentsContext()!;

  return (
    <Components.FormattingToolbar.Button
      label={label}
      mainTooltip={label}
      icon={icon}
      onClick={() => {
        editor.toggleStyles({ [name]: true });
      }}
    />
  );
}
