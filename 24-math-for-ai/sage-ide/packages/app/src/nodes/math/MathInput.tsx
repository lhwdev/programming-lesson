import clsx from "clsx";
import "./MathInput.css";
import { SimpleCodeBlockEditor } from "@/common/code/SimpleCodeBlockEditor";
import { MutableRefObject } from "react";
import { Editor } from "@tiptap/react";

export function MathInput({ content, strings, onChange, onSubmit, className, editorRef }: {
  /** note that change of value is not reflected... I'm lazy yeah */
  content: string;
  strings: { placeholder: string };
  onChange: (content: string) => void;
  onSubmit: (content: string, direction?: "left" | "right") => void;
  className?: string;
  editorRef?: MutableRefObject<Editor | undefined>;
}) {
  return (
    <SimpleCodeBlockEditor
      value={content}
      language="latex"
      options={{
        placeholder: strings.placeholder,
        initialSelection: "all",
        onChange,
        enterAction() {
          onSubmit(content);
          return true;
        },
        leaveAction(direction) {
          onSubmit(content, direction);
        },
        editorRef,
      }}
      className={clsx("bn-ex-math-input", className)}
      editorProps={{ attributes: { "data-autofocus": "" } }}
    />
  );
}
