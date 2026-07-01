import type { AvatarSelection, PartialFaceFeatures } from "../types/face";
import { defaultFeatures } from "./schema";

export function mapFeaturesToSelection(features: PartialFaceFeatures): AvatarSelection {
  return {
    ...defaultFeatures,
    ...features
  };
}
