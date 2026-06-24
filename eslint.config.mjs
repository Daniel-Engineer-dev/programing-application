import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Tắt các quy tắc gây phiền phức nhất
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off", // Tắt cảnh báo dependencies của useEffect
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/**", // Thêm dòng này nếu muốn ESLint bỏ qua toàn bộ code trong thư mục src
  ]),
]);

export default eslintConfig;
