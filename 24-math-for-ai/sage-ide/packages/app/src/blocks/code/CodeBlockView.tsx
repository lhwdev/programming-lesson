import clsx from "clsx";
import classes from "./CodeBlockView.module.css";

export interface CodeBlockViewProps {
  language: string;
  setLanguage: (value: string) => void;
  contentRef: (element: HTMLDivElement | null) => void;
}

export function CodeBlockView({ language, setLanguage, contentRef }: CodeBlockViewProps) {
  return (
    <div className={classes.codeBlock}>

      <pre>
        <code
          className={clsx(language && `language-${language}`)}
          ref={contentRef}
        />
      </pre>
    </div>
  );
}
