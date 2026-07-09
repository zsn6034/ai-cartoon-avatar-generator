import type { OutfitAnalysisResponse, OutfitFeatureKey, OutfitSelection } from "../../types/outfit";
import { labelForOutfitFeature, outfitFeatureLabels } from "../../outfitRegistry/schema";

type Props = {
  analysis?: OutfitAnalysisResponse;
  aiSelection: OutfitSelection;
  currentSelection: OutfitSelection;
};

export function OutfitReasonPanel({ analysis, aiSelection, currentSelection }: Props) {
  const changed = (Object.keys(aiSelection) as OutfitFeatureKey[]).filter((key) => aiSelection[key] !== currentSelection[key]);

  return (
    <section className="reason-panel outfit-reason-panel">
      <h2>映射原因</h2>
      {analysis ? (
        <>
          <p className="assistant-message">{analysis.assistant_message}</p>
          <div className="reason-list">
            {analysis.reasons.slice(0, 6).map((item, index) => (
              <div className="reason-item" key={`${item.feature}-${index}`}>
                <strong>{outfitFeatureLabels[item.feature as OutfitFeatureKey] ?? item.feature}</strong>
                <span>{item.value}</span>
                <p>{item.reason}</p>
              </div>
            ))}
          </div>
          {analysis.defaults_applied.length > 0 && <p className="hint">默认补全：{analysis.defaults_applied.join(", ")}</p>}
          {changed.length > 0 && (
            <div className="diff-box">
              <strong>手动调整</strong>
              {changed.map((key) => (
                <p key={key}>
                  {outfitFeatureLabels[key]}：AI 推荐 {labelForOutfitFeature(key, aiSelection[key])}，当前选择{" "}
                  {labelForOutfitFeature(key, currentSelection[key])}
                </p>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="empty">完成图片或对话分析后，这里会展示 AI 如何映射到 Messenger 3D 资产。</p>
      )}
    </section>
  );
}
