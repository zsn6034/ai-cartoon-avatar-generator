import type { AvatarFeatureKey, AvatarSelection } from "../types/face";
import { featureKeys, featureLabels, featureOptions } from "../assetsRegistry/schema";

type Props = {
  value: AvatarSelection;
  aiValue: AvatarSelection;
  confidence: Partial<Record<AvatarFeatureKey, number>>;
  onChange: (next: AvatarSelection) => void;
};

export function FeatureEditor({ value, aiValue, confidence, onChange }: Props) {
  return (
    <section className="feature-editor">
      <h2>特征调整</h2>
      <div className="feature-list">
        {featureKeys.map((key) => {
          const changed = value[key] !== aiValue[key];
          return (
            <label className={changed ? "feature-row changed" : "feature-row"} key={key}>
              <span>
                {featureLabels[key]}
                <small>{Math.round((confidence[key] ?? 0.5) * 100)}%</small>
              </span>
              {(key === "hairColor" || key === "skinColor") && <i className="color-swatch" style={{ background: value[key] }} />}
              <select
                value={value[key]}
                onChange={(event) => onChange({ ...value, [key]: event.target.value } as AvatarSelection)}
              >
                {featureOptions[key].map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </section>
  );
}
