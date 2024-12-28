import clsx from "clsx";
import "./MathInput.css";
import { SimpleCodeBlockEditor } from "@/common/code/SimpleCodeBlockEditor";
import { MutableRefObject } from "react";
import { Editor, Extension } from "@tiptap/react";
import { MathError } from "./MathView";
import { Plugin } from "@tiptap/pm/state";
import { useUpdatedRaw } from "@sage-ide/common/utils/useUpdated.js";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export function MathInput({ content, error, strings, onChange, onSubmit, className, editorRef }: {
  /** note that change of value is not reflected... I'm lazy yeah */
  content: string;
  error: MathError | null;
  strings: { placeholder: string };
  onChange: (content: string) => void;
  onSubmit: (content: string, direction?: "left" | "right") => void;
  className?: string;
  editorRef?: MutableRefObject<Editor | undefined>;
}) {
  const currentError = useUpdatedRaw(error);

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
        extensions: [
          Extension.create({
            name: "HighlightTexError",
            addProseMirrorPlugins() {
              const highlightTexError = new Plugin({
                props: {
                  decorations(state) {
                    const error = currentError.current;
                    if(!error) return DecorationSet.empty;

                    const decoration = Decoration.inline(
                      error.position + 1,
                      error.position + error.length + 1,
                      {
                        nodeName: "span",
                        style: "text-decoration: red wavy underline;",
                      },
                    );
                    return DecorationSet.create(state.doc, [decoration]);
                  },
                },
              });
              return [highlightTexError];
            },
          }),
        ],
      }}
      className={clsx("bn-ex-math-input", className)}
      spellCheck={false}
      editorProps={{ attributes: { "data-autofocus": "" } }}
    />
  );
}
