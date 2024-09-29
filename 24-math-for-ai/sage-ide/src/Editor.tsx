import "@blocknote/core/fonts/inter.css";
import "./BlockNote/style.css";
// import { BlockNoteView } from "@blocknote/mantine";
import { SideMenuController, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { filterSuggestionItems, locales } from "@blocknote/core";
import { schema, allSlashMenuItems } from "./schema";
import { BlockNoteView } from "./BlockNote";

export function Editor() {
  const editor = useCreateBlockNote({
    schema,
    dictionary: locales.ko,
  });

  return (
    <BlockNoteView
      editor={editor}
      sideMenu={false}
      slashMenu={false}

    >
      <SideMenuController>

      </SideMenuController>

      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          // Gets all default slash menu items and `insertAlert` item.
          filterSuggestionItems(
            allSlashMenuItems(editor),
            query,
          )}
      />
    </BlockNoteView>
  );
}
