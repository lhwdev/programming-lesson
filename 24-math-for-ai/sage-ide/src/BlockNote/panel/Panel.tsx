import {
  Group as MantineGroup,
  LoadingOverlay as MantineLoadingOverlay,
  Tabs as MantineTabs,
} from "@mantine/core";

import { assertEmpty } from "@blocknote/core";
import { ComponentProps } from "@blocknote/react";
import { forwardRef } from "react";
import { bnClsx } from "../bnClsx";

export const Panel = forwardRef<
  HTMLDivElement,
  ComponentProps["FilePanel"]["Root"]
>((props, ref) => {
  const {
    className,
    tabs,
    defaultOpenTab,
    openTab,
    setOpenTab,
    loading,
    ...rest
  } = props;

  assertEmpty(rest);

  return (
    <MantineGroup className={bnClsx(className)} ref={ref}>
      <MantineTabs
        className={bnClsx()}
        value={openTab}
        defaultValue={defaultOpenTab}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange={setOpenTab as any}
      >
        {loading && <MantineLoadingOverlay visible={loading} />}

        <MantineTabs.List>
          {tabs.map((tab) => (
            <MantineTabs.Tab
              data-test={`${tab.name.toLowerCase()}-tab`}
              value={tab.name}
              key={tab.name}
            >
              {tab.name}
            </MantineTabs.Tab>
          ))}
        </MantineTabs.List>

        {tabs.map((tab) => (
          <MantineTabs.Panel value={tab.name} key={tab.name}>
            {tab.tabPanel}
          </MantineTabs.Panel>
        ))}
      </MantineTabs>
    </MantineGroup>
  );
});
