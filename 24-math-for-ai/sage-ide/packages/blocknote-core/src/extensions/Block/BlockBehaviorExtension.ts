import { Extension } from "@tiptap/core";
import { BlockSelectionExtension } from "./BlockSelectionBehavior";
import { BlockListExtension } from "./BlockList";

export const BlockBehaviorExtension = Extension.create({
  name: "BlockBehavior",
  priority: -10,

  addExtensions() {
    return [BlockListExtension, BlockSelectionExtension];
  },
});
