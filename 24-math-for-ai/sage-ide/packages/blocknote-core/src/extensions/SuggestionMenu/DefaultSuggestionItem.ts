import type { Dictionary } from "../../i18n/dictionary";

export type DefaultSuggestionItem = {
  key: keyof Dictionary["slash_menu"] | "block_column";
  title: string;
  onItemClick: () => void;
  subtext?: string;
  badge?: string;
  aliases?: string[];
  group?: string;
};
