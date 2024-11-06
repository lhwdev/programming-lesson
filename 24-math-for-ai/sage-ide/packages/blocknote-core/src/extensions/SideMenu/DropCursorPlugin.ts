// NOTE: Original content came from prosemirror-dropcursor(https://github.com/ProseMirror/prosemirror-dropcursor)
import { Plugin, EditorState, PluginView, Selection } from "prosemirror-state";
// @ts-expect-error parseFromClipboard is exported for testing, but not marked by types.
import { EditorView, __parseFromClipboard } from "prosemirror-view";
import { dropPoint } from "prosemirror-transform";
import { ResolvedPos } from "prosemirror-model";
import { isBlockSelection } from "../../util/BlockSelection";
import { BlockList } from "../Block/BlockList";

interface DropCursorOptions {
  classes: { root: string; bar: string };
}

interface CursorPos {
  pos: ResolvedPos;
  client?: { x: number; y: number };
}

class DropCursor {
  element: HTMLElement;
  isBlock: boolean;
  source: Selection;
  depth = { default: 0, target: 0 };

  constructor(public readonly parent: DropCursorView, public pos: CursorPos) {
    this.source = parent.view.state.selection;
    this.isBlock = isBlockSelection(this.source);

    const element = document.createElement("div");
    element.className = `bn-drop-cursor ${parent.options.classes.root}`;
    element.dataset.type = this.isBlock ? "block" : "inline";
    parent.view.dom.offsetParent!.appendChild(element);
    this.element = element;

    this.update();
  }

  updatePosition(newPos: CursorPos) {
    const previous = this.pos;
    if(previous === newPos) return;

    if(this.isBlock) newPos = this.coerceBlockPosition(newPos);

    this.pos = newPos;
    this.update(previous);
  }

  private coerceBlockPosition(cursor: CursorPos) {
    const { pos, client } = cursor;
    const doc = pos.doc;
    const container = this.parent.view.state.schema.nodes.blockContainer;
    if(pos.nodeBefore?.type === container || pos.nodeAfter?.type === container) return cursor;

    for(let depth = pos.depth; depth >= 0; depth--) {
      const node = pos.node(depth);
      if(node.type === container) {
        const newPos = doc.resolve(pos.before(depth));
        if(client) {
          const rect = this.parent.view.coordsAtPos(newPos.pos);
          const yCenter = (rect.top + rect.bottom) / 2;
          if(client.y >= yCenter) return {
            pos: doc.resolve(newPos.pos + node.nodeSize), // select end of container
            client: { x: client.x, y: rect.bottom },
          };
          else return {
            pos: newPos,
            client: { x: client.x, y: rect.top },
          };
        } else {
          return { pos: newPos };
        }
      }
    }

    return cursor;
  }

  update(previous: CursorPos = this.pos) {
    const container = this.parent.view.state.schema.nodes.blockContainer;

    const element = this.element;
    const view = this.parent.view;
    const { pos, client } = this.pos;

    if(this.isBlock) {
      const before = pos.nodeBefore;
      const after = pos.nodeAfter;
      if(!before && !after) {
        console.error("TODO: DropCursor into non-node before & after");
        return;
      }

      const nodePos = before ? pos.pos - before.nodeSize : pos.pos;
      const node = view.nodeDOM(nodePos) as HTMLElement; // this is node, so this should not be TextNode
      if(!node) {
        console.error("!node, pos=", nodePos, "node=", view.state.doc.resolve(nodePos).nodeAfter, " text=", view.state.doc.cut(0, nodePos).textContent);
        return;
      }
      const nodeRect = node.getBoundingClientRect();
      const editorRect = view.dom.children.item(0)!.getBoundingClientRect();

      let defaultDepth = 1;
      for(let currentDepth = pos.depth; currentDepth >= 0; currentDepth--) {
        if(pos.node(currentDepth).type === container) defaultDepth++;
      }

      let depth;
      if(client) {
        const deltaX = client.x - editorRect.x;
        depth = Math.ceil(deltaX / 26);
        depth = Math.min(depth, defaultDepth + 1);
        depth = Math.max(depth, defaultDepth - 1);
      } else {
        depth = defaultDepth;
      }
      this.depth = { default: defaultDepth, target: depth };

      // Update the count of bars
      const currentDepth = element.children.length;
      for(let i = depth; i < currentDepth; i++) { // if depth < currentDepth
        element.children.item(0)!.remove();
      }
      for(let i = currentDepth; i < depth; i++) { // if currentDepth < depth
        element.appendChild(document.createElement("div"))
          .className = this.parent.options.classes.bar;
      }

      if(previous.pos.pos !== pos.pos) {
        const top = before ? nodeRect.bottom : nodeRect.top;
        element.style.inset = `${top}px ${editorRect.right}px ${top}px ${editorRect.left}px`;
      }
    } else {
      for(const child of element.children) {
        child.remove();
      }
    }
  }

  destroy() {
    this.element.remove();
  }
}

class DropCursorView implements PluginView {
  cursor: DropCursor | null = null;
  timeout: number = -1;

  constructor(readonly view: EditorView, public options: DropCursorOptions) {
    view.dom.addEventListener("dragover", this.onDragOver);
    view.dom.addEventListener("dragend", this.onDragEnd);
    view.dom.addEventListener("drag", this.onDrop);
    view.dom.addEventListener("dragleave", this.onDragLeave);
  }

  destroy() {
    const view = this.view;

    view.dom.removeEventListener("dragover", this.onDragOver);
    view.dom.removeEventListener("dragend", this.onDragEnd);
    view.dom.removeEventListener("drag", this.onDrop);
    view.dom.removeEventListener("dragleave", this.onDragLeave);
  }

  update(editorView: EditorView, prevState: EditorState) {
    if(this.cursor != null && prevState.doc != editorView.state.doc) {
      if(this.cursor.pos.pos.pos > editorView.state.doc.content.size) {
        this.removeCursor();
      } else {
        this.cursor?.update();
      }
    }
  }

  setCursorPosition(pos: number, client: { x: number; y: number }) {
    const $pos = this.view.state.doc.resolve(pos);
    const cursorPos: CursorPos = { pos: $pos, client };
    if(!this.cursor) {
      this.cursor = new DropCursor(this, cursorPos);
    } else {
      this.cursor.updatePosition(cursorPos);
    }
    return this.cursor;
  }

  removeCursor() {
    if(this.cursor) {
      this.cursor.destroy();
      this.cursor = null;
    }
  }

  scheduleRemoval(timeout: number) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.removeCursor(), timeout);
  }

  onDragOver = (event: DragEvent) => {
    if(!this.view.editable) return;
    const pos = this.view.posAtCoords({ left: event.clientX, top: event.clientY });

    const node = pos && pos.inside >= 0 && this.view.state.doc.nodeAt(pos.inside);
    const disableDropCursor = node && node.type.spec.disableDropCursor;
    const disabled = typeof disableDropCursor == "function" ? disableDropCursor(this.view, pos, event) : disableDropCursor;

    if(pos && !disabled) {
      let target = pos.pos;
      if(this.view.dragging && this.view.dragging.slice) {
        const point = dropPoint(this.view.state.doc, target, this.view.dragging.slice);
        if(point != null) target = point;
      }
      this.setCursorPosition(target, { x: event.clientX, y: event.clientY });
      this.scheduleRemoval(5000);
    }
  };

  onDragEnd = () => {
    this.scheduleRemoval(20);
  };

  onDrop = () => {
    this.scheduleRemoval(20);
  };

  onDragLeave = (event: DragEvent) => {
    if(event.target == this.view.dom || !this.view.dom.contains(event.relatedTarget as Node))
      this.removeCursor();
  };
}

export function dropCursor(options: DropCursorOptions): Plugin {
  let dropCursorView: DropCursorView | null = null;
  return new Plugin({
    view(editorView) {
      dropCursorView = new DropCursorView(editorView, options);
      return dropCursorView;
    },

    appendTransaction(transactions, _oldState, newState) {
      const cursor = dropCursorView?.cursor;
      if(!cursor) return null;

      const tr = newState.tr;
      for(const source of transactions) {
        if(source.getMeta("uiEvent") !== "drop") continue;

        const target = tr.selection;
        const depth = cursor.depth;
        const delta = depth.target - depth.default;
        console.log(depth);

        const props = { state: newState, tr, dispatch: () => {} };
        if(delta === 1) {
          BlockList.BNSinkListItem(target)(props);
        } else if(delta === -1) {
          BlockList.BNLiftListItem(target)(props);
        }
        console.log(tr);
      }

      return tr.docChanged ? tr : null;
    },
  });
}
