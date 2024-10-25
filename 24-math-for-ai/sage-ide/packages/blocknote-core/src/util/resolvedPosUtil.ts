import { Node, ResolvedPos } from "@tiptap/pm/model";
import { ResolvedNode, resolvedNodeFor } from "./BlockSelection";

// NOTE: this does not take care of any text nodes. Be careful!
export class ResolvedNodeStack {
  private indexes: number[];
  private parents: Node[];

  constructor(public $pos: ResolvedPos, public fromDepth: number = 0) {
    const indexes = [];
    const parents = [];
    for(let depth = fromDepth; depth <= $pos.depth; depth++) {
      indexes.push($pos.index(depth));
      parents.push($pos.node(depth));
    }
    this.indexes = indexes;
    this.parents = parents;
  }

  private get currentIndex() {
    return this.indexes[this.indexes.length - 1];
  }

  private set currentIndex(value: number) {
    this.indexes[this.indexes.length - 1] = value;
  }

  private get currentParent() {
    return this.parents[this.parents.length - 1];
  }

  get current(): Node {
    return this.currentParent.child(this.currentIndex);
  }

  resolve(): ResolvedNode {
    // TODO: need check
    const path: Array<Node | number> = (this.$pos as any).path; // (node, index, pos)[depth]
    let pos = this.$pos.start(this.fromDepth);
    for(let depth = 0; depth <= this.indexes.length; depth++) {
      pos++; // enter node
      const node = this.parents[depth];
      const index = this.indexes[depth];
      for(let i = 0; i < index; i++) {
        pos += node.child(i).nodeSize;
      }
      path.push(node, index, pos);
    }
    const $pos = new (ResolvedPos as any)(pos, path, 0);
    return resolvedNodeFor(this.current, $pos);
  }

  get depth(): number {
    return this.fromDepth + this.indexes.length;
  }

  next(): Node | null {
    const index = this.currentIndex;
    const parent = this.currentParent;

    if(index >= parent.childCount) return null;

    const newIndex = index + 1;
    this.currentIndex = newIndex;
    return parent.child(newIndex);
  }

  down() {
    this.parents.push(this.current);
    this.indexes.push(0);
  }

  up() {
    while(this.next()) {
      // consume all nodes
    }
    this.parents.pop();
    this.indexes.pop();
  }
}
