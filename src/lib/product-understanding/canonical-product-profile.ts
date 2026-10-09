import { isProductProfile, type ProductProfile } from "./product-profile";

/** Primary-first canonical profile selection. Missing analysis never blocks source-first generation. */
export function resolveCanonicalProductProfile(values: readonly unknown[]): ProductProfile | null {
  for (const value of values) if (isProductProfile(value)) return value;
  return null;
}

