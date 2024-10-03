import "./MathInput.css";
import { SimpleCodeBlockEditor } from "@/common/code/SimpleCodeBlockEditor";
import { useUncontrolledValue } from "@/common/uncontrolledValue";

export function MathInput({ content, strings, onChange, onSubmit }: {
  /** note that change of value is not reflected... I'm lazy yeah */
  content: string;
  strings: { placeholder: string };
  onChange: (content: string) => void;
  onSubmit: (content: string) => void;
}) {
  const uncontrolled = useUncontrolledValue(content);
  return (
    <SimpleCodeBlockEditor
      value={uncontrolled}
      language="latex"
      options={{
        placeholder: strings.placeholder,
        onChange,
        enterAction() {
          onSubmit(uncontrolled.value);
          return true;
        },
      }}
      className="bn-ex-math-input"
      editorProps={{ attributes: { "data-autofocus": "" } }}
    />
  );
}
