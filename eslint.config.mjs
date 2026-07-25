import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/app/(account)/**/*.{ts,tsx}",
      "src/components/account/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/admin", "@/components/admin/*"],
              message: "Componentes administrativos so podem ser usados em rotas e componentes de admin.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/(public)/**/*.{ts,tsx}", "src/components/public/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/admin", "@/components/admin/*"],
              message: "Componentes administrativos so podem ser usados em rotas e componentes de admin.",
            },
            {
              group: ["@/components/account", "@/components/account/*"],
              message: "Componentes de participante nao pertencem a area publica.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/admin/**/*.{ts,tsx}", "src/components/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/public", "@/components/public/*", "@/components/account", "@/components/account/*"],
              message: "O painel administrativo deve usar apenas componentes admin ou shared.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
