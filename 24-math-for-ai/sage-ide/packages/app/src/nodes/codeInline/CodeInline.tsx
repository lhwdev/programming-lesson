import "@/common/uncontrolledValue";
import classes from "./CodeInline.module.css";
import { createReactStyleSpec } from "@blocknote/react";
import "@/schemaTypes";

export const CodeInline = createReactStyleSpec(
  {
    type: "codeInline",
    propSchema: "boolean",
  }, {
    globalKeyboardShortcuts: (_info) => ({
      "Mod-e": (editor) => {
        editor.toggleStyles({ codeInline: true, bold });
        return true;
      },
    }),
    render({ contentRef }) {
      return (
        <span
          className={classes.codeInline}
          ref={contentRef}
        />
      );
    },
  },
);
