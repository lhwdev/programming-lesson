import { ResolvedPos } from "prosemirror-model";
import { BlockRangeSelection, BlockSelection, ResolvedNode } from "../../util/BlockSelection";
import { EditorState, Plugin, PluginView, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { getInputState } from "../../util/pmInputState";

class BlockSelectionPluginView implements PluginView {
  constructor(private readonly pmView: EditorView) {
    pmView.dom.addEventListener("mousedown", this.mouseDownHandler);
  }

  destroy() {
    this.pmView.dom.removeEventListener("mousedown", this.mouseDownHandler);
  }

  mouseDownHandler = (event: MouseEvent) => {
    const view = this.pmView;
    const mouseDown = getInputState(view).mouseDown;
    if(!mouseDown) return;

    if(event.shiftKey) {
      event.preventDefault();
      const state = view.state;
      const doc = state.doc;

      const blockContainer = state.schema.nodes.blockContainer;
      const findNode = (pos: ResolvedPos) => {
        for(let depth = pos.depth; depth >= 0; depth--) {
          if(pos.node(depth).type === blockContainer) {
            return pos.start(depth);
          }
        }
        return -1;
      };

      const anchor = state.selection.$anchor;
      const anchorNode = findNode(anchor);
      const headNode = findNode(doc.resolve(mouseDown.pos.pos));
      if(anchorNode !== headNode) {
        const tr = state.tr;
        tr.setSelection(new BlockRangeSelection(doc.resolve(anchorNode), doc.resolve(headNode)));
        view.dispatch(tr);
      }
      return;
    }
  };
}

export const BlockSelectionPmPlugin = new Plugin({
  view(view) {
    return new BlockSelectionPluginView(view);
  },
  state: {
    init() {},
    apply(tr, _, oldState, newState) {
      const oldSelection = oldState.selection;
      const newSelection = newState.selection;
      if(oldSelection === newSelection) return;

      const updateState = (tr: Transaction, pos: number, selected: boolean) => {
        tr.setNodeAttribute(pos, "selected", selected);
      };

      if(newSelection instanceof BlockSelection) {
        const addedNodes = newSelection.nodes();
        let removedNodes: ResolvedNode[] = [];
        if(oldSelection instanceof BlockSelection) {
          removedNodes = oldSelection.nodes()
            .filter((node) => !addedNodes.some((added) => added.pos === node.pos));
        }

        for(const removed of removedNodes) {
          updateState(tr, removed.pos, false);
        }
        for(const added of addedNodes) {
          updateState(tr, added.pos, true);
        }
      }
    },
  },
});
