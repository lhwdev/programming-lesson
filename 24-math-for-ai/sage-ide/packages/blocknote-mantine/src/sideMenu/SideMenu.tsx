import { Group as MantineGroup } from "@mantine/core";

import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";
import { bnClsx } from "../bnClsx";

export const SideMenu = forwardRef<
  HTMLDivElement,
  ComponentProps["SideMenu"]["Root"]
>((props, ref) => {
  const { className, children, ...rest } = props;

  assertEmpty(rest, false);

  return (
    <MantineGroup
      align="center"
      gap={0}
      className={bnClsx(className)}
      ref={ref}
      {...rest}
    >
      {children}
    </MantineGroup>
  );
});
