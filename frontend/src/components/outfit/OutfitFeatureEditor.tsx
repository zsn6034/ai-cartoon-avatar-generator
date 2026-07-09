import type { OutfitFeatureKey, OutfitSelection } from "../../types/outfit";
import { outfitFeatureKeys, outfitFeatureLabels, outfitOptions } from "../../outfitRegistry/schema";

type Props = {
  value: OutfitSelection;
  aiValue: OutfitSelection;
  confidence: Partial<Record<OutfitFeatureKey, number>>;
  onChange: (next: OutfitSelection) => void;
};

export function OutfitFeatureEditor({ value, aiValue, confidence, onChange }: Props) {
  return (
    <section className="feature-editor outfit-feature-editor">
      <h2>3D 资产调整</h2>
      <div className="feature-list">
        {outfitFeatureKeys.map((key) => {
          const changed = value[key] !== aiValue[key];
          return (
            <label className={changed ? "feature-row outfit-feature-row changed" : "feature-row outfit-feature-row"} key={key}>
              <span>
                {outfitFeatureLabels[key]}
                <small>{Math.round((confidence[key] ?? 0.5) * 100)}%</small>
              </span>
              <select value={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.value } as OutfitSelection)}>
                {outfitOptions[key].map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label} · {option.description}
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
