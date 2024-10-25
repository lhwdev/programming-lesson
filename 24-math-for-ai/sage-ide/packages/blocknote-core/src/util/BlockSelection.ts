import { Fragment, Node, ResolvedPos, Slice } from "@tiptap/pm/model";
import { Selection, SelectionRange } from "@tiptap/pm/state";
import { Mapping } from "@tiptap/pm/transform";
import { mergeObject } from "@sage-ide/common/utils/mergeObject.ts";
import { dumpNodeShallow } from "./dump";

export interface ResolvedNode extends Node {
  backing: Node;

  $pos: ResolvedPos;
  pos: number;
}

export function resolvedNode($pos: ResolvedPos): ResolvedNode {
  const node = $pos.nodeAfter;
  if(!node) throw new Error(`no node for ${$pos}`);
  return resolvedNodeFor(node, $pos);
}

export function resolvedNodeFor(node: Node, $pos: ResolvedPos): ResolvedNode {
  // if(typeof $pos === "function") {
  //   return mergeObject(node, {
  //     backing: node,
  //     get $pos() {
  //       const pos = $pos();
  //       Object.defineProperty(this, "$pos", { value: pos, get: undefined });
  //       return pos;
  //     },
  //     get pos() { return this.$pos.pos; },
  //   });
  // }
  return mergeObject(node, {
    backing: node,
    $pos,
    get pos() { return $pos.pos; },
  });
}

export function unresolvedNode(node: Node, doc: Node, pos: number): ResolvedNode {
  return mergeObject(node, {
    backing: node,
    get $pos() {
      const $pos = doc.resolve(this.pos);
      Object.defineProperty(this, "$pos", { value: $pos, get: undefined });
      return $pos;
    },
    pos,
  });
}

export abstract class BlockSelection extends Selection {
  abstract nodes(): ResolvedNode[];

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
      anchorBlock = doc.resolve(anchorBlock.start(parentDepth));
      headBlock = doc.resolve(headBlock.start(parentDepth));
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

  override nodes(): ResolvedNode[] {
    const fromPos = this.fromPos;
    const toPos = this.toPos;

    const parent = fromPos.parent;
    const result = [];
    let pos = fromPos.pos + 1;
    console.log(`nodes for BlockRangeSelection from=${fromPos.nodeAfter} to=${toPos.nodeAfter}`);
    console.log(`parents: ${fromPos.parent}==${toPos.parent}, index=${fromPos.index()}..${toPos.index()}`);
    for(let i = fromPos.index(); i <= toPos.index(); i++) {
      const node = parent.child(i);
      dumpNodeShallow(node);
      result.push(unresolvedNode(node, fromPos.doc, pos));
      pos += node.nodeSize;
    }
    return result;
  }

  override map(doc: Node, mapping: Mapping): Selection {
    const anchor = doc.resolve(mapping.map(this.anchorPos.pos));
    const head = doc.resolve(mapping.map(this.headPos.pos));
    if(anchor.pos === head.pos) {
      return Selection.near(anchor);
    } else {
      return new BlockRangeSelection(anchor, head);
    }
  }

  override content(): Slice {
    return new Slice(Fragment.from(this.nodes()), 0, 0);
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

export class MultipleBlockSelection extends BlockSelection {
  private _nodes: ResolvedNode[];

  constructor(nodes: ResolvedPos[]) {
    if(nodes.length === 0) throw new Error("expected at least one node");

    if(nodes.some((node) => node.parent !== nodes[0].parent)) {
      let parentDepth = nodes[0].depth;
      for(const [index, node] of nodes.entries()) {
        if(index === 0) continue;
        const previous = nodes[index - 1];
        parentDepth = node.sharedDepth(previous.start(parentDepth));
      }
      const doc = nodes[0].node(0);
      nodes = nodes.map((node) => doc.resolve(node.start(parentDepth)));
    }

    const resolvedNodes = nodes.map(resolvedNode);

    super(
      nodes[0],
      blockEnd(nodes[nodes.length - 1]),
      resolvedNodes.map((node) => new SelectionRange(node.$pos, blockEnd(node.$pos, node))),
    );
    this._nodes = resolvedNodes;
  }

  override get anchorNode() { return this._nodes[0]; }
  override get headNode() { return this._nodes[this._nodes.length - 1]; }

  override nodes(): ResolvedNode[] {
    return this._nodes;
  }

  override map(doc: Node, mapping: Mapping): Selection {
    const anchor = doc.resolve(mapping.map(this.anchorPos.pos));
    const head = doc.resolve(mapping.map(this.headPos.pos));
    if(anchor.pos === head.pos) {
      return Selection.near(anchor);
    } else { // TODO
      return new BlockRangeSelection(anchor, head);
    }
  }

  override content(): Slice {
    return new Slice(Fragment.from(this.nodes()), 0, 0);
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
