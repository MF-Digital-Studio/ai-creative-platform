# Apparel fidelity benchmark and production notes

The reference-free apparel benchmark variants are `clean_studio_on_model`, `ghost_mannequin_or_flat_lay`, and `neutral_lifestyle_pose`. They are generated from the source product alone. Run them with the same source garment, then validate artwork design, placement, scale, visible text, garment color, and construction before recording the benchmark as passed.

The current artwork region is estimated from ProductProfile location descriptions such as “upper back” and is marked `profile_estimate`. It is not pixel localization. A vision-produced normalized box or a garment segmentation/localization step is needed before region-level placement can be considered reliable.

Pure image generation is structurally weak for exact apparel print reproduction. It can approximate recognizable shapes while changing typography, small details, and print geometry. For strict print fidelity, a hybrid path is likely needed: preserve or generate the person and scene, segment the garment surface, warp the source artwork onto the garment using garment landmarks/depth, then run a constrained finishing pass that is prohibited from changing the artwork. This hybrid path is not implemented here.

The current black T-shirt/back-print manual benchmark was not run because its source product and dark-room reference were not available in the workspace. Until a reference-free benchmark passes, metadata keeps `productFidelityReady` false even when one generated image passes the final product quality gate.
