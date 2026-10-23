// Build the static itch.io upload: dist/ contains the playable site,
// dist/molt-itch.zip has index.html at its root.
import { existsSync, mkdirSync, rmSync, cpSync, copyFileSync, renameSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const archiveTemp = path.join(root, "molt-itch.zip");
const archive = path.join(dist, "molt-itch.zip");

const required = [
  "index.html",
  "styles.css",
  "src/main.js",
  "assets/fonts/anton-latin.woff2",
  "HOW_TO_RUN.txt",
];
for (const file of required) {
  if (!existsSync(path.join(root, file))) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}

rmSync(dist, { recursive: true, force: true });
rmSync(archiveTemp, { force: true });
mkdirSync(dist, { recursive: true });

copyFileSync(path.join(root, "index.html"), path.join(dist, "index.html"));
copyFileSync(path.join(root, "styles.css"), path.join(dist, "styles.css"));
cpSync(path.join(root, "src"), path.join(dist, "src"), { recursive: true });
cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
copyFileSync(path.join(root, "README.md"), path.join(dist, "README.md"));
copyFileSync(path.join(root, "HOW_TO_RUN.txt"), path.join(dist, "HOW_TO_RUN.txt"));

const zip = spawnSync(
  "zip",
  ["-r", "-X", archiveTemp, ".", "-x", "*.DS_Store", "-x", "__MACOSX/*"],
  { cwd: dist, stdio: "inherit" },
);
if (zip.error) {
  console.error("\nCould not run `zip`. Install it (macOS/Linux usually include it) and retry.");
  process.exit(1);
}
if (zip.status !== 0) {
  console.error("\nzip failed while creating the upload archive.");
  process.exit(zip.status || 1);
}
renameSync(archiveTemp, archive);

const list = spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });
if (list.status === 0) {
  const entries = list.stdout.split(/\r?\n/).filter(Boolean);
  if (!entries.includes("index.html")) {
    console.error("Archive check failed: index.html is not at the zip root.");
    process.exit(1);
  }
  console.log(`\nArchive check: OK (${entries.length} entries, index.html at root)`);
} else {
  console.warn("\nCould not verify the archive with unzip; the zip was still created.");
}

const size = statSync(archive).size;
console.log(`Built ${path.relative(root, archive)} (${(size / 1024).toFixed(1)} KB)`);
console.log("Upload this zip as an HTML project on itch.io. Viewport: 1280 × 720.");
