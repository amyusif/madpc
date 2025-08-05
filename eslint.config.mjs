import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

module.exports = {
  // …your existing config…
  rules: {
    // turn off the explicit-any ban
    "@typescript-eslint/no-explicit-any": "off",

    // you can also tweak other globals if you like:
    // "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};

export default eslintConfig;
