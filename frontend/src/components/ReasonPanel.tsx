import type { AnalysisResponse, AvatarSelection, FeatureKey } from "../types/face";
import { featureLabels, featureOptions } from "../assetsRegistry/schema";

type Props = {
  analysis?: AnalysisResponse;
  aiSelection: AvatarSelection;
  currentSelection: AvatarSelection;
};

function labelFor(key: FeatureKey, value: string) {
  return featureOptions[key].find((option) => option.value === value)?.label ?? value;
}

export function ReasonPanel({ analysis, aiSelection, currentSelection }: Props) {
  const changed = (Object.keys(aiSelection) as FeatureKey[]).filter((key) => aiSelection[key] !== currentSelection[key]);

  return (
    <section className="reason-panel">
      <h2>映射原因</h2>
      {analysis ? (
        <>
          <p className="assistant-message">{analysis.assistant_message}</p>
          <div className="reason-list">
            {analysis.reasons.slice(0, 6).map((item, index) => (
              <div className="reason-item" key={`${item.feature}-${index}`}>
                <strong>{featureLabels[item.feature as FeatureKey] ?? item.feature}</strong>
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
                  {featureLabels[key]}：AI 推荐 {labelFor(key, aiSelection[key])}，当前选择 {labelFor(key, currentSelection[key])}
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
