import { Upload } from "lucide-react";

type Props = {
  imageDataUrl?: string;
  busy: boolean;
  onUpload: (file: File, dataUrl: string) => void;
};

export function ImageUpload({ imageDataUrl, busy, onUpload }: Props) {
  function handleChange(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("图片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onUpload(file, String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="upload-panel">
      <label className="upload-target">
        <Upload size={24} />
        <span>{busy ? "分析中..." : "上传人像图片"}</span>
        <input disabled={busy} type="file" accept="image/*" onChange={(event) => handleChange(event.target.files?.[0])} />
      </label>
      {imageDataUrl && <img src={imageDataUrl} alt="上传预览" className="image-preview" />}
    </div>
  );
}
