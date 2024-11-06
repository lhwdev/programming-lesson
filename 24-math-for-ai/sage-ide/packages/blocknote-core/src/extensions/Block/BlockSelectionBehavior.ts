import { BlockRangeSelection, findBlockContainer } from "../../util/BlockSelection";
import { Plugin, PluginView } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { getInputState } from "../../util/pmInputState";
import { Extension } from "@tiptap/core";
import { BlockSelectionDecorationPmPlugin } from "./BlockSelectionDecoration";

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
      const state = view.state;
      const doc = state.doc;

      const previous = state.selection;
      const anchorNode = findBlockContainer(state, previous.$anchor)!.pos;
      const headNode = findBlockContainer(state, doc.resolve(mouseDown.pos.pos))!.pos;
      if(anchorNode !== headNode) {
        // If selecting only plain texts, use normal TextSelection
        // const nodes = selection.nodes();
        // const paragraph = state.schema.nodes.paragraph;
        // const isPlainText = nodes.every((node) => node.child(0).type === paragraph);

        const headInSameBlock = headNode === findBlockContainer(state, previous.$head)!.pos;
        const willSelect = !headInSameBlock;

        if(willSelect) {
          event.preventDefault();
          const tr = state.tr;
          const selection = new BlockRangeSelection(doc.resolve(anchorNode), doc.resolve(headNode));
          tr.setSelection(selection);
          view.dispatch(tr);
        }
      }
      return;
    }
  };
}

const BlockSelectionPmPlugin = new Plugin({
  view(view) {
    return new BlockSelectionPluginView(view);
  },

  props: {
    createSelectionBetween(_view, anchor, head) {
      if(anchor === head) return null;

      const first = anchor.nodeAfter;
      const last = head.nodeBefore;
      if(!first || !last) return null;
      if(first.isInline || last.isInline) return null;

      return BlockRangeSelection.createFromEndpoint(anchor, head);
    },
  },
});

export const BlockSelectionExtension = Extension.create({
  name: "BlockSelection",

  addProseMirrorPlugins() {
    return [BlockSelectionPmPlugin, BlockSelectionDecorationPmPlugin];
  },

  // addGlobalAttributes() {
  //   return [{
  //     types: ["blockContainer"],
  //     attributes: {
  //       selected: {
  //         default: false,
  //         parseHTML(_) {
  //           return false;
  //         },
  //         renderHTML(attributes) {
  //           return { "data-selected": attributes.selected };
  //         },
  //       },
  //     },
  //   }];
  // },
});
