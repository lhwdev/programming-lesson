import { Node } from "prosemirror-model";

export function dumpNodeShallow(node: Node) {
  console.log(`Node ${node.type.name}: attrs=${JSON.stringify(node.attrs)}${node.isText ? ", content=" + node.text : ""}`);
}

export function dumpNode(node: Node, pos = node.type.name === "doc" ? -1 : 0, level = 0) {
  console.log(`${"  ".repeat(level)}Node ${node.type.name}: pos=${pos}, attrs=${JSON.stringify(node.attrs)}${node.isText ? ", content=" + node.text : ""}`);
  pos++;
  for(let i = 0; i < node.content.childCount; i++) {
    const child = node.content.child(i);
    dumpNode(child, pos, level + 1);
    pos += child.nodeSize;
  }
}
