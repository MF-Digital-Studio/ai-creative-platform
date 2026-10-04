# Hybrid apparel artwork projection V1

The generation flow tries a source-pixel print projection only for artwork-bearing, identity-critical, on-model apparel with a localized front or back print. Source artwork comes from the original upload. A conservative border-color separation creates an alpha layer; uncertain extraction returns to the existing exact-product generation path. Vision localizes one torso panel in the original and generated images. The image is composited only when both sides agree, neither panel is occluded, and the relative print rectangle stays within the target print-safe area.

V1 uses an affine resize and subtle local luminance modulation. It does not use a generative finishing pass. It does not perform non-rigid fold warping, foreground masks, OCR, or independent print similarity scoring. Surface localization is a bounding rectangle, not a pixel mask. These gaps mean the projection is an initial implementation, not a validated SKU-fidelity guarantee. Low-contrast prints, multi-color garments, folds, or generated artwork outside the projected layer can still leave visible errors.

## Manual benchmark

The black Konfuss source mockup and rear-view street output are not stored in this repository. When available, generate the same scene once with hybrid eligibility and once with it disabled. Save the original, generative-only output, and hybrid output together. Inspect at 100% and zoomed: lettering, horse/rider structure, arrows, thin lines, graphic colors, relative placement, print width and height, collar distance, texture, folds, occlusion, and scene realism. Record the `provider_metadata.apparelProjection` values for both outputs. Accept the hybrid result only if it looks like the same physical print and materially improves identity over the generative-only result.

## Future scope

Add reliable garment segmentation and foreground occlusion masks, non-rigid fold displacement, multi-signal print comparison including OCR, and one geometry-only repair. Sleeves, pants, all-over prints, multiple garments, embroidery, and reflective prints remain outside V1.
