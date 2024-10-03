import "@/common/uncontrolledValue";
import classes from "./CodeInline.module.css";
import { createReactStyleSpec } from "@blocknote/react";

export const CodeInline = createReactStyleSpec(
  {
    type: "code_inline",
    propSchema: "boolean",
  }, {
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
