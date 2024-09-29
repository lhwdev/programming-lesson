import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, insertOrUpdateBlock } from "@blocknote/core";
import { RiBox1Fill, RiCalculatorFill } from "react-icons/ri";
import { Alert } from "./BlockNote/blocks/Alert";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";
import { MathInline } from "./BlockNote/blocks/math/MathInline";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,

    alert: Alert,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    math_inline: MathInline,
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
  ];
  const grouped = new Map();
  for (const item of all) {
    let group = grouped.get(item.group);
    if(!group) {
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
