import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  // sourcemap fica desligado no build de produção: um .map publicado exporia o
  // código-fonte original (não só o bundle minificado) a qualquer visitante.
  build: { target: "es2022", sourcemap: false, manifest: true },
});
