export interface LanguageFeature {
  increaseIndent(line: string): number;
}

const languageFeatures: Record<string, Partial<LanguageFeature>> = {
  python: {
    increaseIndent(line) {
      return line.trim().endsWith(":") ? 1 : 0;
    },
  },
};

const DefaultLanguageFeature: LanguageFeature = {
  increaseIndent() {
    return 0;
  },
};

export const LanguageFeatures = Object.fromEntries(Object.entries(languageFeatures)
  .map(([key, feature]) => [key, { DefaultLanguageFeature, ...feature }]),
) as Record<string, LanguageFeature>;

export function getLanguageFeature(lang: string) {
  return LanguageFeatures[lang] ?? DefaultLanguageFeature;
}
