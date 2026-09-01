import type { ProductPreservationMode } from "../types";

export function isFashionOnModelUseCase(useCase: string | null | undefined): boolean {
  return useCase === "fashion";
}

export function resolvePreservationModeForUseCase(
  useCase: string | null | undefined,
  fallbackMode: ProductPreservationMode = "pixel_lock",
): ProductPreservationMode {
  return isFashionOnModelUseCase(useCase) ? "reference_edit" : fallbackMode;
}
