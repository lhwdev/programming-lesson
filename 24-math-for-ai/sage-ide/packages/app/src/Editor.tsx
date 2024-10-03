import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { FormattingToolbarController, SideMenuController, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { filterSuggestionItems, locales } from "@blocknote/core";
import { schema, allSlashMenuItems, MyFormattingToolbar } from "./schema";

export function Editor() {
  const editor = useCreateBlockNote({
    schema,
    dictionary: locales.ko,
  });

  return (
    <BlockNoteView
      editor={editor}
      formattingToolbar={false}
      slashMenu={false}
      sideMenu={false}
    >
      <FormattingToolbarController formattingToolbar={MyFormattingToolbar} />

      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          // Gets all default slash menu items and `insertAlert` item.
          filterSuggestionItems(
            allSlashMenuItems(editor),
            query,
          )}
      />

      <SideMenuController>

      </SideMenuController>
    </BlockNoteView>
  );
}
