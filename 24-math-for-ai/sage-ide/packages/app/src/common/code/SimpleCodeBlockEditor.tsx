import "./SimpleCodeBlockEditor.css";
import { EditorContent, useEditor } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Text } from "@tiptap/extension-text";
import { History } from "@tiptap/extension-history";
import { CodeBlockShiki } from "./TiptapCodeBlockShiki";
import { HTMLProps, useMemo } from "react";
import { UncontrolledValue } from "@/common/uncontrolledValue";
import { EditorProps } from "@tiptap/pm/view";
import clsx from "clsx";
import { useUpdated } from "@/utils/useUpdated";

interface Options {
  placeholder?: string;
  enterAction?: () => boolean;
  onChange?: (content: string) => void;
}

export function SimpleCodeBlockEditor({ value, language, options: options_ = {}, editorProps, ...other }: {
  value: UncontrolledValue<string>;
  language: string;
  options?: Partial<Options>;
  editorProps?: EditorProps;
} & Omit<HTMLProps<HTMLDivElement>, "ref" | "value">) {
  const options = useUpdated(options_);
  const editor = useEditor({
    content: {
      type: "doc",
      content: [{
        type: "code_shiki",
        text: value.value,
        attrs: { language },
      }],
    },
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
    ],
    editorProps,
    onUpdate({ transaction }) {
      options.onChange?.(transaction.doc.textContent);
    },
  });
  useMemo(() => {
    if(!editor) return;
    value.attachController(() => editor.getText());
  }, [editor]);

  return (
    <>
      <EditorContent editor={editor} {...other} className={clsx(other.className, "ex-code-block-editor")} />
      <div className="code-block-placeholder" aria-hidden>{options.placeholder}</div>
    </>
  );
}
