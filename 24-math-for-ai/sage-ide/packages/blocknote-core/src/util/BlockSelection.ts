import { Fragment, Node, ResolvedPos, Slice } from "@tiptap/pm/model";
import { EditorState, NodeSelection, Selection } from "@tiptap/pm/state";
import { Mapping } from "@tiptap/pm/transform";
import { ResolvedNode, resolvedNodeFor, unresolvedNode } from "./ResolvedNode";

export function isBlockSelection(selection: Selection): selection is BlockSelection | NodeSelection {
  return selection instanceof BlockSelection || selection instanceof NodeSelection;
}

export function isSelectedNode(selection: Selection, node: Node) {
  if(selection instanceof BlockSelection) {
    return selection.nodes().some((selectedNode) => selectedNode.backing === node);
  } else if(selection instanceof NodeSelection) {
    return selection.$anchor.nodeAfter === node;
  } else {
    return false;
  }
}

export function findBlockContainer(state: EditorState, pos: ResolvedPos): { pos: number; node: Node } | null {
  const container = state.schema.nodes.blockContainer;
  if(pos.nodeAfter?.type === container) return { pos: pos.pos, node: pos.nodeAfter };

  for(let depth = pos.depth; depth >= 0; depth--) {
    const node = pos.node(depth);
    if(node.type === container) return { pos: pos.before(depth), node };
  }

  return null;
}

export abstract class BlockSelection extends Selection {
  protected abstract calculateNodes(): ResolvedNode[];

  protected _nodes: ResolvedNode[] | null = null;
  nodes(): ResolvedNode[] {
    const previous = this._nodes;
    if(previous) return previous;
    const result = this.calculateNodes();
    this._nodes = result;
    return result;
  }

  plainNodes(): Node[] {
    return this.nodes().map((node) => node.backing);
  }

  abstract anchorNode: ResolvedNode;
  abstract headNode: ResolvedNode;

  get anchorPos(): ResolvedPos { return this.anchorNode.$pos; }
  get headPos(): ResolvedPos { return this.headNode.$pos; }

  get fromPos(): ResolvedPos { return this.anchorPos.min(this.headPos); }
  get toPos(): ResolvedPos { return this.anchorPos.max(this.headPos); }
}

const blockEnd = (block: ResolvedPos, node: Node = block.nodeAfter!) =>
  block.doc.resolve(block.pos + node.nodeSize);

export class BlockRangeSelection extends BlockSelection {
  anchorNode: ResolvedNode;
  headNode: ResolvedNode;

  constructor(anchorBlock: ResolvedPos, headBlock: ResolvedPos) {
    if(anchorBlock.parent !== headBlock.parent) {
      const parentDepth = anchorBlock.sharedDepth(headBlock.pos);
      const doc = anchorBlock.doc;
      anchorBlock = doc.resolve(anchorBlock.before(parentDepth + 1));
      headBlock = doc.resolve(headBlock.before(parentDepth + 1));
    }

    const anchorNode = anchorBlock.nodeAfter;
    const headNode = headBlock.nodeAfter;

    if(!anchorNode || !headNode) throw new Error("not pointing into Node");

    if(anchorBlock.pos < headBlock.pos) {
      super(anchorBlock, blockEnd(headBlock, headNode));
    } else {
      super(blockEnd(anchorBlock, anchorNode), headBlock);
    }

    this.anchorNode = resolvedNodeFor(anchorNode, anchorBlock);
    this.headNode = resolvedNodeFor(headNode, headBlock);
  }

  static createFromEndpoint(anchor: ResolvedPos, head: ResolvedPos) {
    const findStart = (pos: ResolvedPos) => {
      const node = pos.nodeBefore;
      if(!node) throw new Error("does not selecting the endpoint of node");
      return pos.doc.resolve(pos.pos - node.nodeSize);
    };
    if(anchor.pos < head.pos) {
      head = findStart(head);
    } else {
      anchor = findStart(anchor);
    }
    return new BlockRangeSelection(anchor, head);
  }

  override calculateNodes(): ResolvedNode[] {
    const fromPos = this.fromPos;
    const toPos = this.toPos;

    const parent = fromPos.parent;
    const result = [];
    let pos = fromPos.pos;
    for(let i = fromPos.index(); i <= toPos.index(); i++) {
      const node = parent.child(i);
      result.push(unresolvedNode(node, fromPos.doc, pos));
      pos += node.nodeSize;
    }
    return result;
  }

  override map(doc: Node, mapping: Mapping): Selection {
    const anchor = doc.resolve(mapping.map(this.anchorPos.pos));
    const head = doc.resolve(mapping.map(this.headPos.pos));
    return new BlockRangeSelection(anchor, head);
  }

  override content(): Slice {
    return new Slice(Fragment.from(this.plainNodes()), 0, 0);
  }

  override eq(selection: Selection): boolean {
    return selection instanceof BlockRangeSelection
      && selection.anchorPos.pos === this.anchorPos.pos
      && selection.headPos.pos === this.headPos.pos;
  }

  override toJSON() {
    return { type: "blocks_range", anchorNode: this.anchorPos.pos, headNode: this.headPos.pos };
  }
}
