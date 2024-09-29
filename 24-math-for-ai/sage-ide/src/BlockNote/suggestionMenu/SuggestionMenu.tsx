import { Stack as MantineStack } from "@mantine/core";

import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";
import { bnClsx } from "../bnClsx";

export const SuggestionMenu = forwardRef<
  HTMLDivElement,
  ComponentProps["SuggestionMenu"]["Root"]
>((props, ref) => {
  const { className, children, id, ...rest } = props;

  assertEmpty(rest);

  return (
    <MantineStack
      gap={0}
      className={bnClsx(className)}
      ref={ref}
      id={id}
      role="listbox"
    >
      {children}
    </MantineStack>
  );
});
