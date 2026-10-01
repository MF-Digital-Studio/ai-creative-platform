# Auto Repair V1

Auto Repair V1 runs inside the same logical generation. It can make at most one additional provider call:

```text
attempt 0 → validate → optional attempt 1 → validate → deterministic selection
```

The second call is made only when the first validation result is `fail` and `retryRecommended` is true. Warning-only, clean, unavailable, and non-recommended failures do not retry. The repair prompt appends a short targeted section to the existing final prompt, preserving ProductProfile, scene, composition, creative-compliance, and preservation rules.

The extra attempt can add one provider generation cost and one validation cost, plus their latency. There is no recursive repair, autonomous loop, strategy switching, or provider/model switching. If repair generation or repair validation fails, the original image remains the safe default.
