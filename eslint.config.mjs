import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  { ignores: [".next/", ".react-email/", "dist/"] },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { projectService: true } },
  },
  {
    ignores: ["src/db/**/*.ts", "src/db/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message: "Please import via `@/db` as appropriate",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["src/components/ui/**/*.ts", "src/components/ui/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@radix-ui/*"],
              message:
                "Imports directly from radix-ui are generally incorrect; please check and ignore this if necessary",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["src/lib/routing/*.ts", "src/lib/routing/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "next/navigation",
              message:
                "Do not cal next builtins directly; instead use the new routing tools from @/lib/routing",
            },
            {
              name: "next/router",
              message:
                "Do not cal next builtins directly; instead use the new routing tools from @/lib/routing",
            },
            {
              name: "next/link",
              message:
                "Do not cal next builtins directly; instead use the new routing tools from @/lib/routing",
            },
          ],
        },
      ],
    },
  },
);
