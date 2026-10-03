import type { SupportedVertical } from "@/lib/verticals/supported-verticals";
import type { ProductTransformation } from "@/lib/product-understanding/types";

import { PRODUCT_IDENTITY_LOCK_VERSION } from "./identity-lock-version";

export type ProductIdentityManifest = {
  version: typeof PRODUCT_IDENTITY_LOCK_VERSION;
  vertical: SupportedVertical | "product";
  subcategory: string | null;
  immutableAttributes: string[];
  geometryAnchors: string[];
  colorMaterialAnchors: string[];
  brandingAnchors: string[];
  interactionSensitiveAttributes: string[];
  allowedDeformations: ProductTransformation[];
  forbiddenChanges: string[];
};
