import clsx from "clsx";
import classes from "./CodeBlockView.module.css";
import { Button, Combobox, useCombobox } from "@mantine/core";
import { createStyleCssForTheme, highlighterCache, languages } from "@sage-ide/common/code/highlight/index.ts";
import { useMemo } from "react";

export interface CodeBlockViewProps {
  language: string;
  setLanguage: (value: string) => void;
  contentRef: (element: HTMLDivElement | null) => void;
}

export function CodeBlockView({ language, setLanguage, contentRef }: CodeBlockViewProps) {
  const combobox = useCombobox({});
  const languageOptions = useMemo(() => languages.map((lang) => (
    <Combobox.Option
      key={lang}
      value={lang}
    >
      {lang}
    </Combobox.Option>
  )), []);

  return (
    <div className={classes.codeBlock}>
      <Combobox
        store={combobox}
        onOptionSubmit={(lang) => {
          setLanguage(lang);
          combobox.closeDropdown();
        }}
        width="max-content"
        position="bottom-start"
      >
        <Combobox.Target>
          <div className={classes.buttons} data-retain={combobox.dropdownOpened} contentEditable={false}>
            <Button
              size="compact-xs"
              color="gray"
              variant="subtle"
              rightSection={<Combobox.Chevron />}
              onClick={() => combobox.toggleDropdown()}
            >
              {language}
            </Button>
          </div>
        </Combobox.Target>
        <Combobox.Dropdown>
          {languageOptions}
        </Combobox.Dropdown>
      </Combobox>

      <style dangerouslySetInnerHTML={{ __html: useMemo(() =>
        highlighterCache ? createStyleCssForTheme(highlighterCache.getTheme("vitesse-light")) : ""
      , [highlighterCache]) }}
      />

      <pre spellCheck={false}>
        <code
          className={clsx(language && `language-${language}`)}
        >
          <span ref={contentRef} />
        </code>
      </pre>
    </div>
  );
}
