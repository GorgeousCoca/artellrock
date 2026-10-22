import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    // Файлы, генерируемые Payload CLI
    ignores: ["src/payload-types.ts", "src/app/(payload)/admin/importMap.js", "src/migrations/**"]
  }
];

export default config;
