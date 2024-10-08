import { TextInput as MantineTextInput } from "@mantine/core";

import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";
import { bnClsx } from "../bnClsx";

export const PanelTextInput = forwardRef<
  HTMLInputElement,
  ComponentProps["FilePanel"]["TextInput"]
>((props, ref) => {
  const { className, value, placeholder, onKeyDown, onChange, ...rest } = props;

  assertEmpty(rest);

  return (
    <MantineTextInput
      size="xs"
      data-test="embed-input"
      className={bnClsx(className)}
      ref={ref}
      value={value}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={onChange}
    />
  );
});
