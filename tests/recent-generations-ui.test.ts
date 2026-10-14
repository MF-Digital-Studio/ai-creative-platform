import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const gallery = read("src/components/dashboard/recent-generations-gallery.tsx");
const styles = read("src/app/globals.css");

test("recent generations use a fixed, responsive card grid without horizontal scrolling", () => {
  assert.match(styles, /\.dashboard-generation-grid \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, 12rem\), 1fr\)\)/);
  assert.doesNotMatch(styles, /\.dashboard-generation-grid \{[^}]*overflow-x: auto/);
  assert.doesNotMatch(styles, /\.dashboard-generation-grid \{[^}]*scroll-snap-type/);
});

test("mixed source aspect ratios render inside one normalized 4:5 preview frame", () => {
  assert.match(styles, /\.dashboard-generation-media \{[^}]*aspect-ratio: 4 \/ 5/);
  assert.match(styles, /\.dashboard-generation-media img \{[^}]*height: 100%[^}]*object-fit: cover/);
  assert.match(styles, /\.dashboard-generation-card \{[^}]*overflow: hidden[^}]*border: 1px solid var\(--dashboard-border\)/);
});

test("generation metadata keeps titles truncated and renders date plus aspect ratio", () => {
  assert.match(styles, /\.dashboard-generation-copy strong \{[^}]*text-overflow: ellipsis[^}]*white-space: nowrap/);
  assert.match(gallery, /<time dateTime=\{generation\.createdAt\}>\{formattedDate\}\{formatLabel\}<\/time>/);
  assert.match(gallery, /generation\.aspectRatio/);
});

test("empty and loading gallery states use the same compact card system", () => {
  assert.match(gallery, /completed\.length === 0/);
  assert.match(gallery, /dashboard-empty-state/);
  const loading = read("src/app/[locale]/dashboard/loading.tsx");
  assert.match(loading, /dashboard-generation-grid/);
  assert.match(loading, /GenerationCardSkeleton/);
  assert.match(styles, /\.generation-card-skeleton-media \{ aspect-ratio: 4 \/ 5/);
});

test("the grid and full-card link remain accessible", () => {
  assert.match(gallery, /aria-label=\{messages\.galleryLabel\}/);
  assert.match(gallery, /dashboard-generation-card-link/);
  assert.match(styles, /\.dashboard-generation-card-link:focus-visible/);
  assert.match(styles, /@media \(hover: none\), \(max-width: 767px\)/);
});
