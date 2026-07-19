/**
 * Post-build step: emits dist/sw.js from scripts/sw-template.js.
 *
 * The shell list is every file Vite produced (index.html served as "/"),
 * so a fresh install precaches the complete app — including the hashed
 * dex.json data bundle. The version is a hash of all file contents:
 * identical builds keep their caches, changed builds roll over cleanly.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(dist)
  .map((path) => "/" + relative(dist, path).split("\\").join("/"))
  .filter((path) => path !== "/sw.js");

const shell = files.map((path) => (path === "/index.html" ? "/" : path)).sort();

const hash = createHash("sha1");
for (const path of files.sort()) {
  hash.update(path);
  hash.update(readFileSync(join(dist, path)));
}
const version = hash.digest("hex").slice(0, 12);

const template = readFileSync(join(root, "scripts", "sw-template.js"), "utf8");
writeFileSync(
  join(dist, "sw.js"),
  template.replace(/__VERSION__/g, version).replace("__SHELL__", JSON.stringify(shell)),
);

console.log(`sw: ${shell.length} shell files, version ${version}`);
