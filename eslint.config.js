import tseslint from "typescript-eslint";
import storybook from "eslint-plugin-storybook";

export default tseslint.config(
  { ignores: ["static/**", "node_modules/**", "storybook-static/**"] },
  {
    files: ["src/**/*.ts", "src/**/*.tsx", "e2e/**/*.ts", ".storybook/**/*.ts", ".storybook/**/*.tsx"],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": true,
        "ts-nocheck": true,
        "ts-check": false,
      }],
    },
  },
  storybook.configs["flat/recommended"],
);
