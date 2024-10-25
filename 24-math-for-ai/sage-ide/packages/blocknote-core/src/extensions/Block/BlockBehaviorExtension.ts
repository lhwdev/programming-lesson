import { Extension } from "@tiptap/core";
import { BlockSelectionPmPlugin } from "./BlockSelectionBehavior";

export const BlockBehaviorExtension = Extension.create({
  name: "BlockBehavior",
  priority: -10,

  addProseMirrorPlugins() {
    return [BlockSelectionPmPlugin];
  },
});
