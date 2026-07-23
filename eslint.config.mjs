import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * Peony syncs three kinds of state from an effect on purpose:
       *   1. client-only values (greeting, current date) that must not be part of
       *      the server render, or hydration mismatches,
       *   2. the URL (?d=2026-07-23) into local view state,
       *   3. stored records into autosaving draft fields.
       * All three are the documented patterns; the compiler rule cannot tell them
       * apart from accidental cascades, so it advises rather than blocks.
       */
      "react-hooks/set-state-in-effect": "warn",
      // react-hook-form's ref-based internals are opaque to the compiler.
      "react-hooks/incompatible-library": "warn",
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
