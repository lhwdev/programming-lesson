export type CombinedColor = Partial<{
  text: string;
  background: string;
}>;

export type ColorScheme = Partial<{
  editor: CombinedColor;
  menu: CombinedColor;
  tooltip: CombinedColor;
  hovered: CombinedColor;
  selected: CombinedColor;
  disabled: CombinedColor;
  shadow: string;
  border: string;
  sideMenu: string;
  highlights: Partial<{
    gray: CombinedColor;
    brown: CombinedColor;
    red: CombinedColor;
    orange: CombinedColor;
    yellow: CombinedColor;
    green: CombinedColor;
    blue: CombinedColor;
    purple: CombinedColor;
    pink: CombinedColor;
  }>;
}>;

export type Theme = Partial<{
  colors: ColorScheme;
  borderRadius: number;
  fontFamily: string;
}>;

type NestedObject = { [key: string]: number | string | NestedObject };

export const applyBlockNoteCSSVariablesFromTheme = (theme: Theme) => {
  const result: Record<string, string> = {};

  function traverse(current: NestedObject, currentKey = "--bn") {
    for (const key in current) {
      const kebabCaseKey = key
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();
      const fullKey = `${currentKey}-${kebabCaseKey}`;

      if(typeof current[key] !== "object") {
        // Convert numbers to px
        if(typeof current[key] === "number") {
          current[key] = `${current[key]}px`;
        }

        result[fullKey] = current[key];
      } else {
        traverse(current[key] as NestedObject, fullKey);
      }
    }
  }

  traverse(theme);

  return result;
};
