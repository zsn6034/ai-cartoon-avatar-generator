import type { AnalysisResponse, AvatarFeatureKey, AvatarSelection } from "../types/face";
import { featureLabels, labelForFeature } from "../assetsRegistry/schema";

type Props = {
  analysis?: AnalysisResponse;
  aiSelection: AvatarSelection;
  currentSelection: AvatarSelection;
};

export function ReasonPanel({ analysis, aiSelection, currentSelection }: Props) {
  const changed = (Object.keys(aiSelection) as AvatarFeatureKey[]).filter((key) => aiSelection[key] !== currentSelection[key]);

  return (
    <section className="reason-panel">
      <h2>映射原因</h2>
      {analysis ? (
        <>
          <p className="assistant-message">{analysis.assistant_message}</p>
          <div className="reason-list">
            {analysis.reasons.slice(0, 6).map((item, index) => (
              <div className="reason-item" key={`${item.feature}-${index}`}>
                <strong>{featureLabels[item.feature as AvatarFeatureKey] ?? item.feature}</strong>
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
                  {featureLabels[key]}：AI 推荐 {labelForFeature(key, aiSelection[key])}，当前选择 {labelForFeature(key, currentSelection[key])}
                </p>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="empty">完成图片或对话分析后，这里会展示 AI 识别和资产映射依据。</p>
      )}
    </section>
  );
}
