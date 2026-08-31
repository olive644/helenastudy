import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const distDirectory = new URL("../dist/", import.meta.url);
const assetsDirectory = new URL("../dist/assets/", import.meta.url);
const MAX_INITIAL_JS_BYTES = 220 * 1024;
const MAX_TOTAL_JS_BYTES = 300 * 1024;
const MAX_TTS_WORKER_BYTES = 190 * 1024;
const MAX_TTS_WASM_BYTES = 14 * 1024 * 1024;
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
const ttsWorker = sizes.find((item) => item.file.startsWith("piper-tts.worker-"));
const applicationTotal = sizes
  .filter((item) => item !== ttsWorker)
  .reduce((sum, item) => sum + item.bytes, 0);
const wasmFiles = files.filter((file) => file.endsWith(".wasm"));
const wasmBytes = (
  await Promise.all(wasmFiles.map((file) => stat(join(assetsDirectory.pathname, file))))
).reduce((sum, item) => sum + item.size, 0);

console.log(`JavaScript inicial: ${(initialBytes / 1024).toFixed(1)} KiB`);
console.log(`JavaScript da aplicação: ${(applicationTotal / 1024).toFixed(1)} KiB`);
console.log(`Worker TTS opcional: ${((ttsWorker?.bytes ?? 0) / 1024).toFixed(1)} KiB`);
console.log(`WASM TTS opcional: ${(wasmBytes / 1024 / 1024).toFixed(1)} MiB`);
if (initialBytes > MAX_INITIAL_JS_BYTES) {
  throw new Error(
    `Entrada inicial excedida: ${(initialBytes / 1024).toFixed(1)} KiB > ${MAX_INITIAL_JS_BYTES / 1024} KiB.`,
  );
}
if (applicationTotal > MAX_TOTAL_JS_BYTES) {
  throw new Error(
    `JavaScript da aplicação excedido: ${(applicationTotal / 1024).toFixed(1)} KiB > ${MAX_TOTAL_JS_BYTES / 1024} KiB.`,
  );
}
if ((ttsWorker?.bytes ?? 0) > MAX_TTS_WORKER_BYTES)
  throw new Error(`Worker TTS excedido: ${(ttsWorker?.bytes ?? 0) / 1024} KiB.`);
if (wasmBytes > MAX_TTS_WASM_BYTES)
  throw new Error(`WASM TTS excedido: ${(wasmBytes / 1024 / 1024).toFixed(1)} MiB.`);
