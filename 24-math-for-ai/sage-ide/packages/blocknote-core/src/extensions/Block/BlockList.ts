import { CommandProps, Extension } from "@tiptap/core";
import { Fragment, NodeRange, NodeType, Slice } from "prosemirror-model";
import { Selection } from "prosemirror-state";
import { canJoin, liftTarget, ReplaceAroundStep } from "prosemirror-transform";
import { isBlockGroup } from "../../pm-nodes/BlockGroup";
import { createBlockGroup } from "../../pm-nodes/BlockContainer";

export function sinkListItem(itemType: NodeType): import("prosemirror-state").Command {
  return function (state, dispatch) {
    const { $from, $to } = state.selection;
    const range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild!.type == itemType);
    if(!range) return false;
    const startIndex = range.startIndex;
    if(startIndex == 0) return false;
    const parent = range.parent, nodeBefore = parent.child(startIndex - 1);
    if(nodeBefore.type != itemType) return false;

    if(dispatch) {
      const nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
      const inner = Fragment.from(nestedBefore ? itemType.create() : null);
      const slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))),
        nestedBefore ? 3 : 1, 0);
      const before = range.start, after = range.end;
      dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after,
        before, after, slice, 1, true))
        .scrollIntoView());
    }
    return true;
  };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockList: {
      BNSinkListItem(selection?: Selection): ReturnType;
    };
  }
}

export const BlockListExtension = Extension.create({
  name: "BlockListExtension",

  addCommands() {
    return {
      BNSinkListItem(selection?: Selection) {
        return ({ state, tr, dispatch }) => {
          const blockContainer = state.schema.nodes.blockContainer;

          const { $from, $to } = selection ?? state.selection;
          const range = $from.blockRange($to, (node) => isBlockGroup(node.type));
          if(!range) return false;

          const startIndex = range.startIndex;
          if(startIndex == 0) return false;

          const parent = range.parent;
          const nodeBefore = parent.child(startIndex - 1);

          if(dispatch) {
            const nestedBefore = nodeBefore.lastChild && isBlockGroup(nodeBefore.lastChild.type);
            const inner = Fragment.from(nestedBefore ? blockContainer.create() : null);
            const blockGroup = createBlockGroup(state.schema, $from.node(range.depth - 1).firstChild!.type, inner);
            const slice = new Slice(
              Fragment.from(blockContainer.create(null, Fragment.from(blockGroup))),
              nestedBefore ? 3 : 1,
              0,
            );

            const before = range.start;
            const after = range.end;
            // ReplaceAroundStep: ....---***+++++**--....
            // i) nestedBefore=false:
            //    nodeBefore = <container> prev </container>
            //    gap = <*container> *sel </*container>
            //    inserted = <+group> <*container> *sel </*container> </+group> </+container>
            //    So, result = <group> |nodeBefore:<container> prev |inserted:<+group> <*container> *sel </*container> </+group> </+container>
            tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true));
            tr.scrollIntoView();
          }
          return true;
        };
      },

      BNLiftListItem(selection?: Selection) {
        function liftToOuterList({ state, dispatch }: CommandProps, itemType: NodeType, range: NodeRange) {
          const tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
          if(end < endOfList) {
            // There are siblings after the lifted items, which must become
            // children of the last item
            tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList,
              new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
            range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
          }
          const target = liftTarget(range);
          if(target == null) return false;
          tr.lift(range, target);
          const after = tr.mapping.map(end, -1) - 1;
          if(canJoin(tr.doc, after)) tr.join(after);
          tr.scrollIntoView();
          return true;
        }

        function liftOutOfList({ state, dispatch }: CommandProps, range: NodeRange) {
          const tr = state.tr, list = range.parent;
          // Merge the list items into a single big item
          for(let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
            pos -= list.child(i).nodeSize;
            tr.delete(pos - 1, pos + 1);
          }
          const $start = tr.doc.resolve(range.start), item = $start.nodeAfter!;
          if(tr.mapping.map(range.end) != range.start + $start.nodeAfter!.nodeSize) return false;
          const atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
          const parent = $start.node(-1), indexBefore = $start.index(-1);
          if(!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1,
            item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
            return false;
          const start = $start.pos, end = start + item.nodeSize;
          // Strip off the surrounding list. At the sides where we're not at
          // the end of the list, the existing list is closed. At sides where
          // this is the end, it is overwritten to its end.
          tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1,
            new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty)))
              .append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))),
            atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));

          tr.scrollIntoView();
          return true;
        }

        return (props) => {
          const { state, dispatch } = props;
          const blockContainer = state.schema.nodes.blockContainer;
          const { $from, $to } = selection ?? state.selection;

          const range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild!.type == itemType);
          if(!range) return false;
          if(!dispatch) return true;
          if($from.node(range.depth - 1).type == itemType) // Inside a parent list
            return liftToOuterList(props, itemType, range);
          else // Outer list node
            return liftOutOfList(props, range);
        };
      },
    };
  },
});
