import { EditorContent, useEditor } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Text } from "@tiptap/extension-text";
import { History } from "@tiptap/extension-history";
import { CodeBlockShiki } from "./TiptapCodeBlockShiki";
import { useMemo } from "react";

export function SimpleCodeBlockEditor({ initialValue, getContentRef }: {
  initialValue: string;
  getContentRef: (getter: () => string) => void; },
) {
  const editor = useEditor({ extensions: [Document, Text, CodeBlockShiki, History] });
  useMemo(() => {
    if(!editor) return;
    editor.commands.insertContent({ type: "code_shiki", text: initialValue, attrs: { language: "python" } });
    getContentRef(() => editor.getText());
  }, [editor]);

  return <EditorContent editor={editor} />;
}
