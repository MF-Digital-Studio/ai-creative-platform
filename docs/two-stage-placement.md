# Two-stage identity placement v1

This path is selected only for `jewelry_on_model`, `watch_on_wrist`, and
`footwear_on_model`. Still life, studio, apparel, cosmetics, and Pixel Lock
compatible rigid scenes continue to use one generation.

Stage A prepares a product-free body scene. It uses reference images only for
pose, framing, camera, lighting, and environment, then keeps the finger,
wrist, or foot clear for placement. A narrow semantic gate checks target
visibility, usable space, and composition; an unsuitable scene fails cleanly
without retries. Stage A is transient: it is passed to the
next request in memory and is never uploaded as a visible generation result.

Stage B is a multi-image edit: the Stage A scene and the original product are
sent together. Its instructions declare source pixels as the product identity
authority and permit only perspective, scale, lighting, contact, and occlusion
adaptation. Fidelity validation and the single optional auto-repair apply only
to Stage B.

## Provider limitations

GPT Image supports multi-image editing, but this flow has no documented,
reliable API for deriving an anatomical local edit mask for a finger, wrist, or
foot. Therefore v1 uses explicit target-region instructions and scene
preservation rather than an automatic local mask. It can strongly request the
source design, but cannot guarantee pixel-identical placement or prevent all
identity drift; a similar-but-different product must be rejected by the Stage B
validator.

## Cost and latency

Single pass uses one image generation. Two-stage placement uses a Stage A scene
generation, a Stage A readiness check, a Stage B edit, semantic validation, and
at most one Stage B repair edit. It is intentionally limited to
identity-sensitive worn products.
