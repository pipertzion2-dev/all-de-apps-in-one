import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "coverage/**",
      // Bundled skill/artifact templates — not application source
      ".local/**",
      ".config/**",
      "client/**",
    ],
  },
  // Next 16 React Compiler–style rules are strict for this codebase (shadcn, Three.js, marketing copy).
  // Core Web Vitals stays on; these are relaxed so `npm run lint` is a useful gate, not noise.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "warn",
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
