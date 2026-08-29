import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const assetsDirectory = new URL("../dist/assets/", import.meta.url);
const MAX_INITIAL_JS_BYTES = 220 * 1024;
const files = await readdir(assetsDirectory);
const javascriptFiles = files.filter((file) => file.endsWith(".js"));
const sizes = await Promise.all(
  javascriptFiles.map(async (file) => ({
    file,
    bytes: (await stat(join(assetsDirectory.pathname, file))).size,
  })),
);
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);

console.log(`JavaScript do build: ${(total / 1024).toFixed(1)} KiB`);
if (total > MAX_INITIAL_JS_BYTES) {
  throw new Error(
    `Orçamento excedido: ${(total / 1024).toFixed(1)} KiB > ${MAX_INITIAL_JS_BYTES / 1024} KiB.`,
  );
}
