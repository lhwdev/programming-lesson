import { Plugin, PluginKey, Selection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { BlockSelection } from "../../util/BlockSelection";
import { ResolvedNode } from "../../util/ResolvedNode";

interface State {
  decorations: DecorationSet;
  selection: Selection;
}

export const BlockSelectionDecorationPmPlugin = new Plugin<State>({
  key: new PluginKey("BlockSelectionDecoration"),
  state: {
    init(_config, instance) {
      return {
        decorations: DecorationSet.empty,
        selection: instance.selection,
      };
    },

    apply(tr, value, _oldState, newState) {
      const oldSelection = value.selection;
      const newSelection = tr.selection;
      if(oldSelection === newSelection) return value;

      if(!(oldSelection instanceof BlockSelection || newSelection instanceof BlockSelection)) return value;

      const decorations: Decoration[] = [];
      const updateState = (node: ResolvedNode, selected: boolean) => {
        const decoration = Decoration.node(node.pos, node.pos + node.nodeSize, { class: selected ? "selected" : "" });
        decorations.push(decoration);
      };

      let addedNodes: ResolvedNode[] = [];
      let removedNodes: ResolvedNode[] = [];

      if(newSelection instanceof BlockSelection) {
        addedNodes = newSelection.nodes();
        if(oldSelection instanceof BlockSelection) {
          removedNodes = oldSelection.nodes()
            .filter((node) => !addedNodes.some((added) => added.pos === node.pos));
        }
      } else if(oldSelection instanceof BlockSelection) {
        removedNodes = oldSelection.nodes();
      }

      for(const removed of removedNodes) {
        updateState(removed, false);
      }
      for(const added of addedNodes) {
        updateState(added, true);
      }

      return {
        decorations: DecorationSet.create(newState.doc, decorations),
        selection: newSelection,
      };
    },
  },

  props: {
    decorations(state) {
      return this.getState(state)?.decorations;
    },
  },
});
