import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const controls = read("src/components/projects/project-control-panel.tsx");
const gallery = read("src/components/projects/generation-gallery.tsx");
const productAssets = read("src/components/projects/product-image-upload.tsx");
const references = read("src/components/projects/reference-asset-list.tsx");
const styles = read("src/app/globals.css");

test("project workspace keeps the creative direction and generation action in its inspector", () => {
  assert.match(controls, /<CreativeDirectionForm/);
  assert.match(controls, /creativeDirection=\{creativeDirection\}/);
  assert.match(controls, /<GenerateImageForm/);
  assert.doesNotMatch(controls, /!hasOutput \? <GenerateImageForm/);
});

test("workspace preserves its image-first canvas, inspector and selectable generation history", () => {
  assert.match(gallery, /className="project-review-panel project-canvas"/);
  assert.match(gallery, /className="project-inspector"/);
  assert.match(gallery, /className="project-generation-history-list"/);
  assert.match(gallery, /onSelectionChange\(item\.status === "succeeded"/);
  assert.match(styles, /\.project-canvas \{[\s\S]*?min-height: calc\(100svh/);
  assert.match(styles, /\.project-generation-history-list \{ display: flex/);
});

test("product identity and reference authority remain visibly distinct", () => {
  assert.match(productAssets, /project-product-identity-section/);
  assert.match(references, /project-reference-direction-section/);
  assert.match(styles, /\.project-inspector \.project-product-identity-section/);
  assert.match(styles, /\.project-inspector \.project-reference-direction-section/);
});
