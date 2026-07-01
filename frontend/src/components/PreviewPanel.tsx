import type { AvatarSelection } from "../types/face";
import { AvatarCanvas } from "../canvas/AvatarCanvas";

type Props = {
  avatar: AvatarSelection;
};

export function PreviewPanel({ avatar }: Props) {
  return (
    <section className="preview-panel">
      <AvatarCanvas avatar={avatar} />
    </section>
  );
}
