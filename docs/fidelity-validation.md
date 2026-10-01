# Fidelity Validation V1

`fidelity_status` and `fidelity_validation` have different meanings.

- `preservation_mode` records the generation strategy (`reference_edit` or `pixel_lock`).
- `fidelity_status` records deterministic pixel-lock behavior: whether a pixel-locked product was verified, failed verification, or was unavailable for that preservation mode.
- `fidelity_validation` is post-generation semantic quality control. It compares the original source asset with the generated image using the configured vision model and records an interpretable issue-based gate (`pass`, `pass_with_warnings`, `fail`, or `validation_unavailable`).

The original product asset remains the visual authority. ProductProfile, scene suitability, composition, and applied creative requirements constrain the validation brief but never replace source pixels.

Validation is best-effort. An unavailable validator does not fail generation and does not become a pass. It is recorded as `validation_unavailable`, while the generated asset remains accessible. V1 only recommends a retry in metadata; it does not trigger retry or repair.
