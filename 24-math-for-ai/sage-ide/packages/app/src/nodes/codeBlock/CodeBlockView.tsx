import clsx from "clsx";
import classes from "./CodeBlockView.module.css";
import { Button, Combobox, useCombobox } from "@mantine/core";
import { createStyleCssForTheme, getHighlighter, getLanguage, globalCodeRootName, highlighterCache, LanguageInfo, Languages } from "@sage-ide/common/code/highlight/index.ts";
import { useMemo, useState } from "react";
import { Grammar } from "shiki";

export interface CodeBlockViewProps {
  language: LanguageInfo;
  grammar: Grammar | null;
  setLanguage: (value: string) => void;
  contentRef: (element: HTMLDivElement | null) => void;
}

export function CodeBlockView({ language, grammar, setLanguage, contentRef }: CodeBlockViewProps) {
  const [search, setSearch] = useState("");
  const combobox = useCombobox({
    onDropdownOpen() {
      setSearch("");
    },
  });
  const languageOptions = useMemo(() => Languages.all.map((lang) => (
    <Combobox.Option
      key={lang.id}
      value={lang.id}
    >
      {lang.name}
    </Combobox.Option>
  )), []);

  return (
    <div className={classes.codeBlock}>
      <Combobox
        store={combobox}
        onOptionSubmit={(lang) => {
          setLanguage(lang);
          (async () => {
            const info = Languages.find(lang);
            if(!info) return;
            await getLanguage(await getHighlighter(), info);
            combobox.closeDropdown();
          })();
        }}
        width="max-content"
        position="bottom-start"
        dropdownPadding={0}
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
              {language.name}
            </Button>
          </div>
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="언어 검색"
          />
          <Combobox.Options p={4} mah={600} style={{ overflowY: "auto" }}>
            {languageOptions}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      <style dangerouslySetInnerHTML={{ __html: useMemo(
        () => highlighterCache ? createStyleCssForTheme(highlighterCache.getTheme("vitesse-light")) : "",
        [highlighterCache],
      ) }}
      />

      <pre spellCheck={false}>
        <code
          className={clsx(language && `language-${language.name}`, globalCodeRootName, grammar?._rootScopeName)}
        >
          <span ref={contentRef} />
        </code>
      </pre>
    </div>
  );
}
