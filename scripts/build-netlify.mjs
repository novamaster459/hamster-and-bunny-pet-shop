import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const publicFiles = ["index.html", "styles.css", "app.js", "sample.svg"];

await mkdir(output, { recursive: true });
await Promise.all(
    publicFiles.map((file) => copyFile(resolve(root, file), resolve(output, file))),
);
