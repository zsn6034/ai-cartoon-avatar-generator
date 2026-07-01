import type { ProviderId } from "../types/face";

type Props = {
  value: ProviderId;
  providers: Array<{ id: ProviderId; label: string; model: string; configured: boolean }>;
  onChange: (provider: ProviderId) => void;
};

export function ProviderSelect({ value, providers, onChange }: Props) {
  return (
    <label className="provider-select">
      <span>Provider</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ProviderId)}>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.label} · {provider.configured ? provider.model : "未配置"}
          </option>
        ))}
      </select>
    </label>
  );
}
