import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "src");
const dist = join(root, "dist");

const baseCss = readFileSync(join(src, "base.css"), "utf8");
const icons = readFileSync(join(src, "icons.html"), "utf8");

// dist folder per dsCard group
const groupDir = { Foundations: "foundations", Components: "components", Screens: "screens" };

for (const file of readdirSync(join(src, "parts"))) {
  if (!file.endsWith(".html")) continue;
  const part = readFileSync(join(src, "parts", file), "utf8");
  const firstLineEnd = part.indexOf("\n");
  const marker = part.slice(0, firstLineEnd).trim();
  const body = part.slice(firstLineEnd + 1);
  if (!marker.startsWith("<!-- @dsCard")) throw new Error(`${file}: missing @dsCard first-line marker`);
  const group = /group="([^"]+)"/.exec(marker)?.[1];
  const outDir = join(dist, groupDir[group] ?? "misc");
  mkdirSync(outDir, { recursive: true });

  const html = `${marker}
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Better Pokédex — ${file.replace(".html", "")}</title>
<style>
${baseCss}
</style>
</head>
<body>
${icons}
${body}
</body>
</html>
`;
  writeFileSync(join(outDir, file), html);
  console.log(`built ${groupDir[group] ?? "misc"}/${file}`);
}
