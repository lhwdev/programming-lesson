import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

interface InputState {
  mouseDown: MouseDown | null;
}

// Part of https://github.com/ProseMirror/prosemirror-view/blob/17b508f618c944c54776f8ddac45edcb49970796/src/input.ts#L302
interface MouseDown {
  startDoc: Node;
  pos: { pos: number; inside: number };
  event: MouseEvent;
}

export function getInputState(view: EditorView): InputState {
  return (view as any).input;
}
