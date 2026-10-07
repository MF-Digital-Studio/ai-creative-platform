import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const viewer = readFileSync(join(root, "src/components/projects/project-image-viewer.tsx"), "utf8");
const styles = readFileSync(join(root, "src/app/globals.css"), "utf8");

test("image viewer derives pan bounds from the natural aspect ratio and current viewport", () => {
  assert.match(viewer, /event\.currentTarget\.naturalWidth/);
  assert.match(viewer, /availableWidth \/ naturalSize\.width/);
  assert.match(viewer, /availableHeight \/ naturalSize\.height/);
  assert.match(viewer, /const width = fittedSize\.width \* nextScale/);
});

test("image viewer keeps interaction refs synchronized during zoom and drag", () => {
  assert.match(viewer, /scaleRef\.current = boundedScale/);
  assert.match(viewer, /panRef\.current = nextPan/);
  assert.match(viewer, /updatePan\(clampPan/);
  assert.match(styles, /\.project-lightbox-viewport\.is-dragging \.project-lightbox-image \{ transition: none; \}/);
});
