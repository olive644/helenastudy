import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const distDirectory = new URL("../dist/", import.meta.url);
const assetsDirectory = new URL("../dist/assets/", import.meta.url);
const MAX_INITIAL_JS_BYTES = 220 * 1024;
const MAX_TOTAL_JS_BYTES = 300 * 1024;
const manifest = JSON.parse(await readFile(new URL(".vite/manifest.json", distDirectory), "utf8"));
const entry = Object.values(manifest).find((item) => item.isEntry === true);
if (!entry?.file) throw new Error("Entrada principal ausente do manifesto do build.");

const initialBytes = (await stat(join(distDirectory.pathname, entry.file))).size;
const files = await readdir(assetsDirectory);
const javascriptFiles = files.filter((file) => file.endsWith(".js"));
const sizes = await Promise.all(
  javascriptFiles.map(async (file) => ({
    file,
    bytes: (await stat(join(assetsDirectory.pathname, file))).size,
  })),
);
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);

console.log(`JavaScript inicial: ${(initialBytes / 1024).toFixed(1)} KiB`);
console.log(`JavaScript total: ${(total / 1024).toFixed(1)} KiB`);
if (initialBytes > MAX_INITIAL_JS_BYTES) {
  throw new Error(
    `Entrada inicial excedida: ${(initialBytes / 1024).toFixed(1)} KiB > ${MAX_INITIAL_JS_BYTES / 1024} KiB.`,
  );
}
if (total > MAX_TOTAL_JS_BYTES) {
  throw new Error(
    `JavaScript total excedido: ${(total / 1024).toFixed(1)} KiB > ${MAX_TOTAL_JS_BYTES / 1024} KiB.`,
  );
}
