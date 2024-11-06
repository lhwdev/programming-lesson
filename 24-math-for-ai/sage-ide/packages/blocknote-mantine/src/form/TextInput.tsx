import { ActionIcon, TextInput as MantineTextInput } from "@mantine/core";

import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef, useRef } from "react";
import { bnClsx } from "../bnClsx";
import { RiCheckLine, RiCloseLine } from "react-icons/ri";
import { mergeRefs } from "@mantine/hooks";

export const TextInput = forwardRef<
  HTMLInputElement,
  ComponentProps["Generic"]["Form"]["TextInput"]
>((props, ref) => {
  const {
    className,
    name,
    label,
    icon,
    value,
    autoFocus,
    placeholder,
    rightSection,
    onKeyDown,
    onChange,
    onSubmit,
    ...rest
  } = props;

  assertEmpty(rest);

  const myRef = useRef<HTMLInputElement>(null);
  let rightSectionContent = <></>;
  if(rightSection) {
    if(rightSection === "submit")
      rightSectionContent = <ActionIcon onClick={onSubmit}><RiCheckLine /></ActionIcon>;
    else if(rightSection === "delete")
      rightSectionContent = <ActionIcon variant="subtle" onClick={() => myRef.current!.value = ""}><RiCloseLine /></ActionIcon>;
  }

  return (
    <MantineTextInput
      size="xs"
      className={bnClsx(className)}
      ref={mergeRefs(ref, myRef)}
      name={name}
      label={label}
      leftSection={icon}
      value={value}
      autoFocus={autoFocus}
      data-autofocus={autoFocus ? "true" : undefined}
      placeholder={placeholder}
      rightSection={rightSectionContent}
      onKeyDown={onKeyDown}
      onChange={onChange}
      onSubmit={onSubmit}
    />
  );
});
