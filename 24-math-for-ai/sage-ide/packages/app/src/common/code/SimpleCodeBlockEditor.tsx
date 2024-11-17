import "./SimpleCodeBlockEditor.css";
import { Content, Editor, EditorContent, Extension, Extensions, useEditor, UseEditorOptions } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Text } from "@tiptap/extension-text";
import { History } from "@tiptap/extension-history";
import { CodeBlockShiki } from "./TiptapCodeBlockShiki";
import { HTMLProps, MutableRefObject, useMemo } from "react";
import { UncontrolledValue, useOnControlledChange } from "@/common/uncontrolledValue";
import { EditorProps } from "@tiptap/pm/view";
import clsx from "clsx";
import { useUpdated } from "@sage-ide/common/utils/useUpdated.ts";
import { AllSelection, Plugin, PluginKey } from "@tiptap/pm/state";

interface Options {
  placeholder?: string;
  initialSelection?: "all";
  enterAction?: () => boolean;
  leaveAction?: (direction?: "left" | "right") => void;
  onChange?: (content: string) => void;
  editorRef?: MutableRefObject<Editor | undefined>;
  extensions?: Extensions;
}

function initial(content: string, language: string): Content {
  return {
    type: "doc",
    content: [{
      type: "code_shiki",
      attrs: { language },
      content: content
        ? [{
            type: "text",
            text: content,
          }]
        : [],
    }],
  };
}

export function SimpleCodeBlockEditor({ value, language, options: options_ = {}, editorProps, ...other }: {
  value: string | UncontrolledValue<string>;
  language: string;
  options?: Partial<Options>;
  editorProps?: EditorProps;
} & Omit<HTMLProps<HTMLDivElement>, "ref" | "value">) {
  // eslint-disable-next-line prefer-const
  let editor: Editor | null;
  const controlled = useOnControlledChange(value, (newValue) => editor!.commands.setContent(initial(newValue, language)));
  const options = useUpdated(options_);
  const valueNow = typeof value === "string" ? value : value.value;
  const editorOptions = useMemo<UseEditorOptions>(() => ({
    content: initial(valueNow, language),
    extensions: [
      Document,
      Text,
      History,
      CodeBlockShiki.configure({
        root: true,
        enterAction() {
          return options.enterAction?.() ?? false;
        },
      }),
      options.leaveAction && Extension.create({
        addProseMirrorPlugins: () => [new Plugin({
          key: new PluginKey("arrowToLeave"),
          props: {
            handleKeyDown(view, event) {
              if(event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
              const anchor = view.state.selection.$anchor;
              const isEmpty = view.state.selection.empty;
              if(
                anchor.textOffset === 0
              ) {
                if(event.key === "ArrowLeft" && !anchor.nodeBefore && isEmpty) {
                  options.leaveAction?.("left");
                } else if(event.key === "ArrowRight" && !anchor.nodeAfter && isEmpty) {
                  options.leaveAction?.("right");
                }
              }
            },
          },
        })],
      }),
      ...options.extensions ?? [],
    ].filter((t) => t) as Extensions,
    editorProps,
    onCreate({ editor }) {
      const sel = options.initialSelection;
      if(sel) editor.commands.command(({ tr }) => {
        if(sel === "all" && valueNow !== "") {
          tr.setSelection(new AllSelection(tr.doc));
        }
        tr.setMeta("addToHistory", false);
        return true;
      });
    },
    onUpdate({ transaction }) {
      if(options.onChange) {
        const newValue = transaction.doc.textContent;
        controlled.expectChanged(newValue);
        options.onChange?.(newValue);
      }
    },
  }), []);
  editor = useEditor(editorOptions);
  if(options.editorRef && editor) options.editorRef.current = editor;
  useMemo(() => {
    if(!editor) return;
    if(typeof value === "object") {
      value.attachController(() => editor.getText());
    }
  }, [value, editor]);

  return (
    <>
      <EditorContent editor={editor} {...other} className={clsx(other.className, "ex-code-block-editor")} />
      <div className="code-block-placeholder" aria-hidden>{options.placeholder}</div>
    </>
  );
}
