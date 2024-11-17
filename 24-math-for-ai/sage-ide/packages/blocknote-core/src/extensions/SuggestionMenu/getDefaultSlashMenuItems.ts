import { Block, PartialBlock } from "../../blocks/defaultBlocks";
import type { BlockNoteEditor } from "../../editor/BlockNoteEditor";

import { checkDefaultBlockTypeInSchema, checkDefaultInlineContentTypeInSchema } from "../../blocks/defaultBlockTypeGuards";
import {
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
  isStyledTextInlineContent,
} from "../../schema";
import { formatKeyboardShortcut } from "../../util/browser";
import { DefaultSuggestionItem } from "./DefaultSuggestionItem";

// Sets the editor's text cursor position to the next content editable block,
// so either a block with inline content or a table. The last block is always a
// paragraph, so this function won't try to set the cursor position past the
// last block.
function setSelectionToNextContentEditableBlock<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, I, S>) {
  if(!editor.isInsideBlock()) return;
  let block = editor.getTextCursorPosition()!.block;
  let contentType = editor.schema.blockSchema[block.type].content;

  while(contentType === "none") {
    block = editor.getTextCursorPosition()!.nextBlock!;
    contentType = editor.schema.blockSchema[block.type].content as
    | "inline"
    | "table"
    | "none";
    editor.setTextCursorPosition(block, "end");
  }
}

// Checks if the current block is empty or only contains a slash, and if so,
// updates the current block instead of inserting a new one below. If the new
// block doesn't contain editable content, the cursor is moved to the next block
// that does.
export function insertOrUpdateBlock<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(
  editor: BlockNoteEditor<BSchema, I, S>,
  block: PartialBlock<BSchema, I, S>,
): Block<BSchema, I, S> {
  const position = editor.getTextCursorPosition();
  if(!position) return 0 as any;
  const currentBlock = position.block;

  if(currentBlock.content === undefined) {
    throw new Error("Slash Menu open in a block that doesn't contain content.");
  }

  if(
    Array.isArray(currentBlock.content)
    && ((currentBlock.content.length === 1
      && isStyledTextInlineContent(currentBlock.content[0])
      && currentBlock.content[0].type === "text"
      && currentBlock.content[0].text === "/")
      || currentBlock.content.length === 0)
  ) {
    editor.updateBlock(currentBlock, block);
  } else {
    editor.insertBlocks([block], currentBlock, "after");
    editor.setTextCursorPosition(
      position.nextBlock!,
      "end",
    );
  }

  const insertedBlock = editor.getTextCursorPosition()!.block;
  setSelectionToNextContentEditableBlock(editor);

  return insertedBlock;
}

export function getDefaultSlashMenuItems<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, I, S>) {
  const items: DefaultSuggestionItem[] = [];

  if(checkDefaultBlockTypeInSchema("heading", editor)) {
    items.push(
      {
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "heading",
            props: { level: 1 },
          });
        },
        badge: formatKeyboardShortcut("Mod-Alt-1"),
        key: "heading",
        ...editor.dictionary.slash_menu.heading,
      },
      {
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "heading",
            props: { level: 2 },
          });
        },
        badge: formatKeyboardShortcut("Mod-Alt-2"),
        key: "heading_2",
        ...editor.dictionary.slash_menu.heading_2,
      },
      {
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "heading",
            props: { level: 3 },
          });
        },
        badge: formatKeyboardShortcut("Mod-Alt-3"),
        key: "heading_3",
        ...editor.dictionary.slash_menu.heading_3,
      },
    );
  }

  if(checkDefaultBlockTypeInSchema("numberedListItem", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "numberedListItem",
        });
      },
      badge: formatKeyboardShortcut("Mod-Shift-7"),
      key: "numbered_list",
      ...editor.dictionary.slash_menu.numbered_list,
    });
  }

  if(checkDefaultBlockTypeInSchema("bulletListItem", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "bulletListItem",
        });
      },
      badge: formatKeyboardShortcut("Mod-Shift-8"),
      key: "bullet_list",
      ...editor.dictionary.slash_menu.bullet_list,
    });
  }

  if(checkDefaultBlockTypeInSchema("checkListItem", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "checkListItem",
        });
      },
      badge: formatKeyboardShortcut("Mod-Shift-9"),
      key: "check_list",
      ...editor.dictionary.slash_menu.check_list,
    });
  }

  if(checkDefaultBlockTypeInSchema("paragraph", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "paragraph",
        });
      },
      badge: formatKeyboardShortcut("Mod-Alt-0"),
      key: "paragraph",
      ...editor.dictionary.slash_menu.paragraph,
    });
  }

  if(checkDefaultBlockTypeInSchema("table", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "table",
          content: {
            type: "tableContent",
            rows: [
              {
                cells: ["", "", ""],
              },
              {
                cells: ["", "", ""],
              },
            ],
          },
        });
      },
      badge: undefined,
      key: "table",
      ...editor.dictionary.slash_menu.table,
    });
  }

  if(checkDefaultBlockTypeInSchema("image", editor)) {
    items.push({
      onItemClick: () => {
        const insertedBlock = insertOrUpdateBlock(editor, {
          type: "image",
        });

        // Immediately open the file toolbar
        editor.dispatch(
          editor._tiptapEditor.state.tr.setMeta(editor.filePanel!.plugin, {
            block: insertedBlock,
          }),
        );
      },
      key: "image",
      ...editor.dictionary.slash_menu.image,
    });
  }

  if(checkDefaultBlockTypeInSchema("video", editor)) {
    items.push({
      onItemClick: () => {
        const insertedBlock = insertOrUpdateBlock(editor, {
          type: "video",
        });

        // Immediately open the file toolbar
        editor.dispatch(
          editor._tiptapEditor.state.tr.setMeta(editor.filePanel!.plugin, {
            block: insertedBlock,
          }),
        );
      },
      key: "video",
      ...editor.dictionary.slash_menu.video,
    });
  }

  if(checkDefaultBlockTypeInSchema("audio", editor)) {
    items.push({
      onItemClick: () => {
        const insertedBlock = insertOrUpdateBlock(editor, {
          type: "audio",
        });

        // Immediately open the file toolbar
        editor.dispatch(
          editor._tiptapEditor.state.tr.setMeta(editor.filePanel!.plugin, {
            block: insertedBlock,
          }),
        );
      },
      key: "audio",
      ...editor.dictionary.slash_menu.audio,
    });
  }

  if(checkDefaultBlockTypeInSchema("file", editor)) {
    items.push({
      onItemClick: () => {
        const insertedBlock = insertOrUpdateBlock(editor, {
          type: "file",
        });

        // Immediately open the file toolbar
        editor.dispatch(
          editor._tiptapEditor.state.tr.setMeta(editor.filePanel!.plugin, {
            block: insertedBlock,
          }),
        );
      },
      key: "image",
      ...editor.dictionary.slash_menu.file,
    });
  }

  if(checkDefaultInlineContentTypeInSchema("footnoteReference", editor)) {
    items.push({
      onItemClick: () => {
        editor._tiptapEditor.commands.addFootnote();
        // editor.insertInlineContent([{ type: "footnoteReference", props: { id: "" }, content: [] }]);
      },
      key: "footnote_reference",
      title: "격주",
      subtext: "문서의 끝에 격주를 추가합니다.",
      aliases: ["footnote", "격주"],
      group: "고급",
    });
  }

  if(checkDefaultBlockTypeInSchema("blockColumn", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "blockColumn",
        });
      },
      key: "block_column",
      title: "가로 열",
      subtext: "내용을 가로로 나눕니다.",
      aliases: ["column", "가로", "열"],
      group: "고급",
    });
  }

  if(checkDefaultBlockTypeInSchema("quote", editor)) {
    items.push({
      onItemClick: () => {
        insertOrUpdateBlock(editor, {
          type: "quote",
        });
      },
      key: "quote",
      title: "인용",
      aliases: ["quote", "인용"],
      group: "고급",
    });
  }

  items.push({
    onItemClick: () => {
      editor.openSuggestionMenu(":", {
        deleteTriggerCharacter: true,
        ignoreQueryLength: true,
      });
    },
    key: "emoji",
    ...editor.dictionary.slash_menu.emoji,
  });

  return items;
}

export function filterSuggestionItems<
  T extends { title: string; aliases?: readonly string[] },
>(items: T[], query: string) {
  return items.filter(
    ({ title, aliases }) =>
      title.toLowerCase().includes(query.toLowerCase())
      || (aliases
        && aliases.filter((alias) =>
          alias.toLowerCase().includes(query.toLowerCase()),
        ).length !== 0),
  );
}
