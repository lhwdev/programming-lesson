import { Group as MantineGroup } from "@mantine/core";

import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";
import { bnClsx } from "../bnClsx";

export const SuggestionMenuEmptyItem = forwardRef<
  HTMLDivElement,
  ComponentProps["SuggestionMenu"]["EmptyItem"]
>((props, ref) => {
  const { className, children, ...rest } = props;

  assertEmpty(rest);

  return (
    <MantineGroup className={bnClsx(className)} ref={ref}>
      <MantineGroup className="bn-mt-suggestion-menu-item-title">
        {children}
      </MantineGroup>
    </MantineGroup>
  );
});
