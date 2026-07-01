import { useEffect, useRef } from "react";
import type { AvatarSelection } from "../types/face";
import { drawAvatar } from "./drawAvatar";

type Props = {
  avatar: AvatarSelection;
};

export function AvatarCanvas({ avatar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    drawAvatar(context, avatar);
  }, [avatar]);

  return <canvas ref={canvasRef} width={512} height={512} className="avatar-canvas" aria-label="卡通头像预览" />;
}
