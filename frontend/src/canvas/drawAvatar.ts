import type { AvatarSelection } from "../types/face";

const skinColors: Record<AvatarSelection["skin_tone"], string> = {
  fair: "#fde8dc",
  light: "#f4c9a8",
  medium: "#d8a074",
  tan: "#b97b56",
  deep: "#7a4c3a"
};

function ellipsePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

function drawFace(ctx: CanvasRenderingContext2D, avatar: AvatarSelection) {
  const skin = skinColors[avatar.skin_tone];
  ctx.fillStyle = skin;
  ctx.strokeStyle = "#3f2b25";
  ctx.lineWidth = 4;
  ctx.beginPath();

  if (avatar.face_shape === "round") {
    ctx.ellipse(256, 266, 118, 126, 0, 0, Math.PI * 2);
  } else if (avatar.face_shape === "square") {
    ctx.moveTo(150, 176);
    ctx.quadraticCurveTo(256, 134, 362, 176);
    ctx.lineTo(356, 330);
    ctx.quadraticCurveTo(256, 408, 156, 330);
    ctx.closePath();
  } else if (avatar.face_shape === "heart") {
    ctx.moveTo(144, 190);
    ctx.quadraticCurveTo(256, 116, 368, 190);
    ctx.quadraticCurveTo(360, 324, 256, 402);
    ctx.quadraticCurveTo(152, 324, 144, 190);
  } else {
    ctx.ellipse(256, 260, 104, 136, 0, 0, Math.PI * 2);
  }

  ctx.fill();
  ctx.stroke();
}

function drawHair(ctx: CanvasRenderingContext2D, avatar: AvatarSelection, front = false) {
  const hairColor = avatar.presentation_style === "feminine" ? "#2a2024" : avatar.presentation_style === "masculine" ? "#201a18" : "#342720";
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = hairColor;
  ctx.lineWidth = 8;

  if (!front) {
    ctx.beginPath();
    const bottom = avatar.hair_length === "long" ? 438 : avatar.hair_length === "medium" ? 382 : 292;
    ctx.ellipse(256, 242, 142, bottom - 210, 0, Math.PI, 0);
    ctx.lineTo(398, bottom);
    ctx.quadraticCurveTo(256, bottom + 34, 114, bottom);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(126, 204);
  ctx.quadraticCurveTo(170, 118, 256, 120);
  ctx.quadraticCurveTo(352, 122, 390, 204);
  ctx.quadraticCurveTo(318, 168, 256, 178);
  ctx.quadraticCurveTo(190, 168, 126, 204);
  ctx.fill();

  if (avatar.bangs === "yes") {
    ctx.fillStyle = hairColor;
    for (let i = 0; i < 5; i += 1) {
      const x = 188 + i * 34;
      ctx.beginPath();
      ctx.moveTo(x, 146);
      ctx.quadraticCurveTo(x + 22, 194 + (i % 2) * 16, x - 4, 224);
      ctx.quadraticCurveTo(x + 38, 202, x + 42, 154);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (avatar.hair_shape === "wavy") {
    ctx.strokeStyle = "#5a4238";
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(146 + i * 72, 186);
      ctx.bezierCurveTo(170 + i * 72, 212, 122 + i * 72, 244, 152 + i * 72, 274);
      ctx.stroke();
    }
  }
}

function drawEyes(ctx: CanvasRenderingContext2D, avatar: AvatarSelection) {
  const width = avatar.eye_size === "large" ? 42 : avatar.eye_size === "small" ? 26 : 34;
  const height = avatar.eye_size === "large" ? 22 : avatar.eye_size === "small" ? 12 : 17;
  const y = 242;
  const positions = [214, 298];
  positions.forEach((x) => {
    ctx.fillStyle = "#fff8f0";
    ctx.strokeStyle = "#2f2422";
    ctx.lineWidth = 3;
    ellipsePath(ctx, x, y, width / 2, height);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#201614";
    ellipsePath(ctx, x, y + 2, Math.max(5, width / 7), Math.max(6, height / 2));
    ctx.fill();
    if (avatar.eye_lid !== "monolid") {
      ctx.strokeStyle = "#8b5e50";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 8, width / 2, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    if (avatar.eye_lid === "hooded") {
      ctx.strokeStyle = "#4f3830";
      ctx.beginPath();
      ctx.moveTo(x - width / 2, y - 4);
      ctx.quadraticCurveTo(x, y - 14, x + width / 2, y - 4);
      ctx.stroke();
    }
  });
}

function drawBrows(ctx: CanvasRenderingContext2D, avatar: AvatarSelection) {
  ctx.strokeStyle = "#2c201e";
  ctx.lineCap = "round";
  ctx.lineWidth = avatar.brow_thickness === "thick" ? 8 : avatar.brow_thickness === "thin" ? 3 : 5;
  const tilt = avatar.expression === "cool" ? -8 : avatar.expression === "soft" ? 5 : 0;
  [
    [190, 212, 238],
    [274, 296, 322]
  ].forEach(([start, mid, end], index) => {
    ctx.beginPath();
    ctx.moveTo(start, 205 + (index === 0 ? tilt : -tilt));
    ctx.quadraticCurveTo(mid, 192, end, 205 + (index === 0 ? -tilt : tilt));
    ctx.stroke();
  });
}

function drawNose(ctx: CanvasRenderingContext2D, avatar: AvatarSelection) {
  ctx.strokeStyle = "#8d604d";
  ctx.lineWidth = avatar.nose_bridge === "high" ? 4 : 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(256, avatar.nose_bridge === "low" ? 270 : 252);
  ctx.quadraticCurveTo(244, 292, 258, 310);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(248, 314, 3, 0, Math.PI * 2);
  ctx.arc(268, 314, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#6f4638";
  ctx.fill();
}

function drawMouth(ctx: CanvasRenderingContext2D, avatar: AvatarSelection) {
  const width = avatar.lip_fullness === "full" ? 54 : avatar.lip_fullness === "thin" ? 34 : 44;
  const height = avatar.lip_fullness === "full" ? 16 : avatar.lip_fullness === "thin" ? 7 : 11;
  ctx.strokeStyle = "#8e3f42";
  ctx.fillStyle = "#c76268";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (avatar.expression === "smile" || avatar.expression === "soft") {
    ctx.ellipse(256, 348, width / 2, height, 0, 0, Math.PI);
    ctx.stroke();
  } else if (avatar.expression === "cool") {
    ctx.moveTo(256 - width / 2, 350);
    ctx.lineTo(256 + width / 2, 348);
    ctx.stroke();
  } else {
    ctx.ellipse(256, 350, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawAvatar(ctx: CanvasRenderingContext2D, avatar: AvatarSelection) {
  ctx.clearRect(0, 0, 512, 512);
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#f6efe4");
  gradient.addColorStop(1, "#dfe8e4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#b3d2c7";
  ctx.beginPath();
  ctx.ellipse(256, 476, 118, 76, 0, Math.PI, 0);
  ctx.fill();

  drawHair(ctx, avatar, false);
  drawFace(ctx, avatar);
  drawBrows(ctx, avatar);
  drawEyes(ctx, avatar);
  drawNose(ctx, avatar);
  drawMouth(ctx, avatar);
  drawHair(ctx, avatar, true);
}
