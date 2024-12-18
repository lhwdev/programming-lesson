import eslint from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import react from "eslint-plugin-react";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    semi: true,
    arrowParens: true,
    braceStyle: "1tbs",
  }),
  react.configs.flat["jsx-runtime"],
  {
    files: ["packages/*/src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@stylistic/keyword-spacing": ["error", {
        after: true,
        overrides: {
          if: { after: false },
          for: { after: false },
          while: { after: false },
          do: { after: false },
          switch: { after: false },
        },
      }],
      "@stylistic/multiline-ternary": ["warn", "always-multiline", {
        ignoreJSX: true,
      }],
      "@typescript-eslint/no-unused-vars": ["warn", {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": "warn",
    },
  },
];
