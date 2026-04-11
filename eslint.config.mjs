import js from "@eslint/js";
import security from "eslint-plugin-security";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".playwright-cli/**",
      "coverage/**",
      "*.tsbuildinfo",
      "vite.config.js",
      "vite.config.d.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      security
    },
    rules: {
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "security/detect-eval-with-expression": "error",
      "security/detect-new-buffer": "error",
      "security/detect-object-injection": "off"
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-console": "off"
    }
  }
];
