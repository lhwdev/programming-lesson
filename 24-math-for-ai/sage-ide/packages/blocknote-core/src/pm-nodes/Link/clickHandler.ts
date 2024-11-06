import { getMarkAttributes } from "@tiptap/core";
import { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "prosemirror-view";

export type ClickHandlerOptions = {
  type: MarkType;
  openOnClick: ((view: EditorView, event: MouseEvent, attrs: { href: string; target?: string; rel?: string }) => boolean);
};

export function clickHandler(options: ClickHandlerOptions): Plugin {
  return new Plugin({
    key: new PluginKey("handleClickLink"),
    props: {
      handleClick: (view, _pos, event) => {
        if(event.button !== 0) {
          return false;
        }

        if(!view.editable) {
          return false;
        }

        let a = event.target as HTMLElement;
        const els = [];

        while(a.nodeName !== "DIV") {
          els.push(a);
          a = a.parentNode as HTMLElement;
        }

        if(!els.find((value) => value.nodeName === "A")) {
          return false;
        }

        const attrs = getMarkAttributes(view.state, options.type);
        const link = event.target as HTMLAnchorElement;

        const href = link?.href ?? attrs.href;
        const target = link?.target ?? attrs.target;

        if(link && href && options.openOnClick(view, event, attrs as any)) {
          window.open(href, target);

          return true;
        }

        return false;
      },
    },
  });
}
