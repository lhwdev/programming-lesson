import {
  BlockSchema,
  InlineContentSchema,
  mergeCSSClasses,
  StyleSchema,
} from "@blocknote/core";
import {
  BlockNoteViewRaw,
  Components,
  ComponentsContext,
  useBlockNoteContext,
  usePrefersColorScheme,
} from "@blocknote/react";
import { MantineProvider } from "@mantine/core";
import { ClassNames, ClassNamesContent } from "@emotion/react";
import { ComponentProps, useMemo } from "react";

import {
  Theme,
  applyBlockNoteCSSVariablesFromTheme,
} from "./BlockNoteTheme";
import { GridSuggestionMenu } from "./suggestionMenu/gridSuggestionMenu/GridSuggestionMenu";
import { GridSuggestionMenuEmptyItem } from "./suggestionMenu/gridSuggestionMenu/GridSuggestionMenuEmptyItem";
import { GridSuggestionMenuItem } from "./suggestionMenu/gridSuggestionMenu/GridSuggestionMenuItem";
import { GridSuggestionMenuLoader } from "./suggestionMenu/gridSuggestionMenu/GridSuggestionMenuLoader";
import {
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "./menu/Menu";
import { Panel } from "./panel/Panel";
import { PanelButton } from "./panel/PanelButton";
import { PanelFileInput } from "./panel/PanelFileInput";
import { PanelTab } from "./panel/PanelTab";
import { PanelTextInput } from "./panel/PanelTextInput";
import { Popover, PopoverContent, PopoverTrigger } from "./popover/Popover";
import { SideMenu } from "./sideMenu/SideMenu";
import { SideMenuButton } from "./sideMenu/SideMenuButton";
import { SuggestionMenu } from "./suggestionMenu/SuggestionMenu";
import { SuggestionMenuEmptyItem } from "./suggestionMenu/SuggestionMenuEmptyItem";
import { SuggestionMenuItem } from "./suggestionMenu/SuggestionMenuItem";
import { SuggestionMenuLabel } from "./suggestionMenu/SuggestionMenuLabel";
import { SuggestionMenuLoader } from "./suggestionMenu/SuggestionMenuLoader";
import { TableHandle } from "./tableHandle/TableHandle";
import { TextInput } from "./form/TextInput";
import { Toolbar } from "./toolbar/Toolbar";
import { ToolbarButton } from "./toolbar/ToolbarButton";
import { ToolbarSelect } from "./toolbar/ToolbarSelect";
import "./style.css";

export * from "./BlockNoteTheme";
export * from "./defaultThemes";

export const components: Components = {
  FormattingToolbar: {
    Root: Toolbar,
    Button: ToolbarButton,
    Select: ToolbarSelect,
  },
  FilePanel: {
    Root: Panel,
    Button: PanelButton,
    FileInput: PanelFileInput,
    TabPanel: PanelTab,
    TextInput: PanelTextInput,
  },
  GridSuggestionMenu: {
    Root: GridSuggestionMenu,
    Item: GridSuggestionMenuItem,
    EmptyItem: GridSuggestionMenuEmptyItem,
    Loader: GridSuggestionMenuLoader,
  },
  LinkToolbar: {
    Root: Toolbar,
    Button: ToolbarButton,
  },
  SideMenu: {
    Root: SideMenu,
    Button: SideMenuButton,
  },
  SuggestionMenu: {
    Root: SuggestionMenu,
    Item: SuggestionMenuItem,
    EmptyItem: SuggestionMenuEmptyItem,
    Label: SuggestionMenuLabel,
    Loader: SuggestionMenuLoader,
  },
  TableHandle: {
    Root: TableHandle,
  },
  Generic: {
    Form: {
      Root: (props) => <div>{props.children}</div>,
      TextInput: TextInput,
    },
    Menu: {
      Root: Menu,
      Trigger: MenuTrigger,
      Dropdown: MenuDropdown,
      Divider: MenuDivider,
      Label: MenuLabel,
      Item: MenuItem,
    },
    Popover: {
      Root: Popover,
      Trigger: PopoverTrigger,
      Content: PopoverContent,
    },
  },
};

const mantineTheme = {
  // Removes button press effect
  activeClassName: "",
};

function useBlockNoteTheme({ theme, css }: {
  theme?:
    | "light"
    | "dark"
    | Theme
    | {
      light: Theme;
      dark: Theme;
    };
  css: ClassNamesContent["css"];
}) {
  return useMemo(
    () =>
      typeof theme === "object"
        ? "light" in theme
          ? css`
            &[data-color-scheme="light"] {
              ${applyBlockNoteCSSVariablesFromTheme(theme.light)}
            }
            &[data-color-scheme="dark"] {
              ${applyBlockNoteCSSVariablesFromTheme(theme.dark)}
            }
          `
          : css(theme)
        : css``,
    [theme],
  );
}

export const BlockNoteView = <
  BSchema extends BlockSchema,
  ISchema extends InlineContentSchema,
  SSchema extends StyleSchema,
>(
  props: Omit<
    ComponentProps<typeof BlockNoteViewRaw<BSchema, ISchema, SSchema>>,
    "theme"
  > & {
    theme?:
      | "light"
      | "dark"
      | Theme
      | {
        light: Theme;
        dark: Theme;
      };
  },
) => {
  const existingContext = useBlockNoteContext();
  const systemColorScheme = usePrefersColorScheme();
  const defaultColorScheme
    = existingContext?.colorSchemePreference || systemColorScheme;

  const { className, theme, ...rest } = props;

  return (
    <ComponentsContext.Provider value={components}>
      {/* `cssVariablesSelector` scopes Mantine CSS variables to only the editor, */}
      {/* as proposed here:  https://github.com/orgs/mantinedev/discussions/5685 */}
      <ClassNames>
        {({ css }) => {
          const noteTheme = useBlockNoteTheme({ theme, css });
          return (
            <MantineProvider
              theme={mantineTheme}
              cssVariablesSelector=".bn-mantine-root"
              // This gets the element to set `data-mantine-color-scheme` on. Since we
              // don't need this attribute (we use our own theming API), we return
              // undefined here.
              getRootElement={() => undefined}
              defaultColorScheme={defaultColorScheme == "dark" ? "dark" : "light"}
              data-color-scheme={defaultColorScheme == "dark" ? "dark" : "light"}
            >
              <BlockNoteViewRaw
                className={mergeCSSClasses("bn-mantine-root", className || "", noteTheme)}
                theme={typeof theme === "object" ? undefined : theme}
                {...rest}
              />
            </MantineProvider>
          );
        }}
      </ClassNames>

    </ComponentsContext.Provider>
  );
};
