import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";
import { bnClsx } from "../../bnClsx";

export const GridSuggestionMenu = forwardRef<
  HTMLDivElement,
  ComponentProps["GridSuggestionMenu"]["Root"]
>((props, ref) => {
  const { className, children, id, columns, ...rest } = props;

  assertEmpty(rest);

  return (
    <div
      className={bnClsx(className)}

      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` } as any}
      ref={ref}
      id={id}
      role="grid"
    >
      {children}
    </div>
  );
});
