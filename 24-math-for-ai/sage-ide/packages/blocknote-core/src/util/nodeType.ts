import { NodeType } from "prosemirror-model";

export function getNodeGroups(type: NodeType): string[] {
  let list = type.spec.__groupList;
  if(list) return list;

  list = type.spec.group ? type.spec.group.split(" ") : [];
  type.spec.__groupList = list;
  return list;
}

export function isNodeInGroup(type: NodeType, group: string): boolean {
  return getNodeGroups(type).includes(group);
}
