import { BlockNoteSchema, defaultBlockSpecs, insertOrUpdateBlock } from "@blocknote/core";
import { RiBox1Fill } from "react-icons/ri";
import { Alert } from "./blocks/Alert";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,

    alert: Alert,
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
