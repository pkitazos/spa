import eslint from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

// const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  // ...compat.extends("next/core-web-vitals"),
  {
    files: ["*.js", "*.jsx", "*.ts", "*.tsx"],
    plugins: {
      "simple-import-sort": simpleImportSort,
      eslint: eslint,
      tseslint: tseslint.plugin,
    },
    ignores: ["node_modules", ".next", "dist"],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
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
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Packages `react` related packages come first.
            ["^react", "^@?\\w"],
            // Internal packages.
            ["^(@/config)(/.*|$)"],
            ["^(@/dto)(/.*|$)"],
            ["^(@/data-object)(/.*|$)"],
            ["^(@/db)(/.*|$)"],
            ["^(@/server)(/.*|$)"],
            ["^(@/components)(/.*|$)"],
            ["^(@/lib)(/.*|$)"],
            // Side effect imports.
            ["^\\u0000"],
            // Parent imports. Put `..` last.
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports. Put same-folder imports and `.` last.
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports.
            ["^.+\\.?(css)$"],
          ],
        },
      ],
    },
  },
);
