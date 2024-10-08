import { Anchor, Button, Group, Popover, Stack, Text } from "@mantine/core";
import { ReactNode, useState } from "react";
import { MathInput } from "./MathInput";
import { useCounter } from "@sage-ide/common/utils/useCounter.ts";
import { TexHints } from "./TexHints";

interface Strings {
  placeholder: string;
}

export function MathInputDropdown({ strings, opened, setOpened, content, onChange, onEnter, children }: {
  opened: boolean;
  setOpened: (value: boolean) => void;
  strings: Strings;
  content: string;
  onChange: (content: string) => void;
  onEnter: (value: string, direction?: "left" | "right") => void;
  children?: ReactNode;
}) {
  const dropdownKey = useCounter(opened, (before, after) => !before && after);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      middlewares={{}}
      trapFocus
      shadow="md"
    >
      <Popover.Target>
        <span onSelect={() => setOpened(true)} onClick={() => setOpened(true)}>
          {children}
        </span>
      </Popover.Target>
      <Popover.Dropdown>
        <DropdownContent
          key={dropdownKey}
          content={content}
          onChange={onChange}
          strings={strings}
          onEnter={onEnter}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

function DropdownContent({ content, onChange, strings, onEnter }: {
  content: string;
  onChange: (content: string) => void;
  strings: Strings;
  onEnter: (value: string, direction?: "left" | "right") => void;
}) {
  const [hintsOpen, setHintsOpen] = useState(false);
  return (
    <Popover
      opened={hintsOpen}
      onChange={setHintsOpen}
      withinPortal={false}
      offset={20}
    >
      <Popover.Target>
        <Stack gap="4px">
          <Text size="xs" c="dimmed">
            <Anchor c="blue" onClick={() => setHintsOpen(true)}>LaTeX 문법</Anchor>
            에 맞게 수식 입력
          </Text>
          <Group align="baseline">
            <MathInput
              content={content}
              onChange={onChange}
              strings={strings}
              onSubmit={onEnter}
            />
            <Button onClick={() => onEnter(content)}>완료</Button>
          </Group>
        </Stack>
      </Popover.Target>
      <Popover.Dropdown p="0">
        <TexHints insertTex={(tex) => {}} close={() => setHintsOpen(false)} />
      </Popover.Dropdown>
    </Popover>
  );
}
