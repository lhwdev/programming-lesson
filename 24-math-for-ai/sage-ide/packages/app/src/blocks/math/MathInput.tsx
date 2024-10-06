import "./MathInput.css";
import { SimpleCodeBlockEditor } from "@/common/code/SimpleCodeBlockEditor";

export function MathInput({ content, strings, onChange, onSubmit }: {
  /** note that change of value is not reflected... I'm lazy yeah */
  content: string;
  strings: { placeholder: string };
  onChange: (content: string) => void;
  onSubmit: (content: string, direction?: "left" | "right") => void;
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
      }}
      className="bn-ex-math-input"
      editorProps={{ attributes: { "data-autofocus": "" } }}
    />
  );
}
