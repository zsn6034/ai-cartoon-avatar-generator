type Props = {
  value?: string;
  providers: Array<{ id: string; label: string; model: string; configured: boolean }>;
  onChange: (provider: string) => void;
};

export function ProviderSelect({ value, providers, onChange }: Props) {
  return (
    <label className="provider-select">
      <span>Provider</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={!value}>
        {!value && <option value="">加载中</option>}
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.label} · {provider.configured ? provider.model : "未配置"}
          </option>
        ))}
      </select>
    </label>
  );
}
