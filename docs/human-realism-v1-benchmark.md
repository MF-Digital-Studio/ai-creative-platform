# Human Realism V1 manual benchmark

Generate each scene with a known source product. Compare the output with the source product and inspect the human at full size and at a close crop. Record pass, warning or fail for product fidelity, photorealism, human realism, physical contact and visible AI artifacts. Repeat with a clean editorial and a glossy commercial direction; glossy styling must retain believable skin texture. A critical anatomy issue or two major human issues fail the scene.

| Scene | Inspect |
| --- | --- |
| Jewelry: ring on close-up hand | Five fingers and correct thumb, knuckles, nail placement and requested polish, subtle skin texture, ring wrap and contact shadow. |
| Watch: watch on wrist | Wrist and hand anatomy, skin texture, strap tension, case contact and believable proportions. |
| Apparel: model wearing T-shirt or hoodie | Body proportions, hands, visible face and hair, skin, gravity-consistent drape and garment/body contact. Compare artwork, text and placement to the source. |
| Footwear: shoe on model | Leg, ankle and foot anatomy, balanced stance, weight distribution, shoe fit and sole/ground contact. |
| Cosmetics: product beside face or in hand | Natural face, eyelids, lips, hairline, hand anatomy and restrained skin retouching, especially in close-up. |
| Control: pure still life | No human realism instructions or human issue findings. |

For each failed output, check the `humanRealism` metadata and human realism diagnostics. Confirm that the single repair targets the reported anatomy or texture issue while preserving the source product and scene. Validation marked unavailable is not a verified pass.
