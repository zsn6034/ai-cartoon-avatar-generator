import type { AvatarSelection, PartialAvatarFeatures } from "../types/face";
import { defaultFeatures } from "./schema";

export function completeFeatures(features: PartialAvatarFeatures): AvatarSelection {
  return {
    ...defaultFeatures,
    ...features
  };
}
