import { mergeObject } from "@sage-ide/common/utils/mergeObject.js";
import { Node, ResolvedPos } from "prosemirror-model";

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
