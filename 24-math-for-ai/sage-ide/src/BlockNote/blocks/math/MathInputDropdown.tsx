import { Anchor, Button, Group, Popover, TextInput } from "@mantine/core";
import { ReactNode, useState } from "react";

interface Strings {
  placeholder: string;
}

export function MathInputDropdown({ strings, value, onValueChange, children }: {
  strings: Strings;
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
}) {
  const [opened, _setOpened] = useState(false);
  const [dropdownKey, setDropdownKey] = useState(0);
  const setOpened = (value: boolean) => {
    if(!opened && value) {
      setDropdownKey((v) => v + 1);
    }
    _setOpened(value);
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      trapFocus
      shadow="md"
      withinPortal={false}
      zIndex={99999}
    >
      <Popover.Target>
        <span onSelect={() => setOpened(true)} onClick={() => setOpened(true)}>
          {children}
        </span>
      </Popover.Target>
      <Popover.Dropdown>
        <DropdownContent
          key={dropdownKey}
          defaultValue={value}
          strings={strings}
          onValueChange={onValueChange}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

function DropdownContent({ defaultValue, strings, onValueChange }: {
  defaultValue: string;
  strings: Strings;
  onValueChange: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Group align="end">
      <TextInput
        multiple
        label={(
          <>
            <Anchor inherit href="https://example.com/">LaTeX 문법</Anchor>
            에 맞게 수식 입력
          </>
        )}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        placeholder={strings.placeholder}
      />
      <Button>완료</Button>
    </Group>
  );
}
