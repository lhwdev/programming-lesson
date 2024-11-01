import { Extension } from "@tiptap/core";
import { BlockSelectionExtension } from "./BlockSelectionBehavior";

export const BlockBehaviorExtension = Extension.create({
  name: "BlockBehavior",
  priority: -10,

  addExtensions() {
    return [BlockSelectionExtension];
  },
});
