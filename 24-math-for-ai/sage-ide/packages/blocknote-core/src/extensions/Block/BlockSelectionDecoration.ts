import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { BlockSelection } from "../../util/BlockSelection";

export const BlockSelectionDecorationPmPlugin = new Plugin<DecorationSet>({
  key: new PluginKey("BlockSelectionDecoration"),
  state: {
    init(_config, _instance) {
      return DecorationSet.empty;
    },

    apply(tr, value, oldState, _newState) {
      const oldSelection = oldState.selection;
      const newSelection = tr.selection;
      if(oldSelection === newSelection) return value;

      if(!(newSelection instanceof BlockSelection)) {
        if(oldSelection instanceof BlockSelection) {
          return DecorationSet.empty;
        } else {
          return value;
        }
      }

      const decorations = newSelection.nodes().map((node) => {
        return Decoration.node(node.pos, node.pos + node.nodeSize, { class: "selected" });
      });

      return DecorationSet.create(tr.doc, decorations);
    },
  },

  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});
