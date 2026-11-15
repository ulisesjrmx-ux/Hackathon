// Deterministic hand-drawn wax-crayon canvas drawing primitives for Radar & Minimap

function strokePasses(
  ctx: CanvasRenderingContext2D,
  drawPath: (pass: number) => void,
  color: string,
  lineWidth: number,
  alpha = 1
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;

  // Pass 1: primary thick wax crayon stroke
  ctx.globalAlpha = alpha * 0.92;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  drawPath(0);
  ctx.stroke();

  // Pass 2: lighter offset second crayon pass for authentic hand-sketched overlap
  ctx.globalAlpha = alpha * 0.45;
  ctx.lineWidth = Math.max(0.8, lineWidth * 0.65);
  ctx.beginPath();
  drawPath(1);
  ctx.stroke();

  ctx.restore();
}

export function drawCrayonCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  lineWidth = 2,
  seed = 1,
  wobbleAmp = 1.6,
  dashed = false,
  alpha = 1
) {
  const steps = Math.max(20, Math.round(radius * 0.85));
  strokePasses(
    ctx,
    (pass) => {
      const pSeed = seed + pass * 3.7;
      for (let i = 0; i <= steps; i++) {
        if (dashed && pass === 0 && i % 2 === 1) continue;
        const a = (i / steps) * Math.PI * 2;
        const w =
          Math.sin(a * 4 + pSeed) * wobbleAmp * 0.6 +
          Math.cos(a * 7 - pSeed * 1.4) * wobbleAmp * 0.4;
        const r = Math.max(1, radius + w);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0 || (dashed && pass === 0 && i % 2 === 0)) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
    },
    color,
    lineWidth,
    alpha
  );
}

export function drawCrayonEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  lineWidth = 1.5,
  seed = 2,
  wobbleAmp = 1.4,
  dashed = false,
  alpha = 1
) {
  const steps = 36;
  strokePasses(
    ctx,
    (pass) => {
      const pSeed = seed + pass * 2.9;
      for (let i = 0; i <= steps; i++) {
        if (dashed && i % 2 === 1) continue;
        const a = (i / steps) * Math.PI * 2;
        const w =
          Math.sin(a * 5 + pSeed) * wobbleAmp * 0.65 +
          Math.cos(a * 3 - pSeed) * wobbleAmp * 0.35;
        const px = cx + Math.cos(a) * (rx + w);
        const py = cy + Math.sin(a) * (ry + w);
        if (i === 0 || (dashed && i % 2 === 0)) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
    },
    color,
    lineWidth,
    alpha
  );
}

export function drawCrayonLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 1.6,
  seed = 1,
  wobbleAmp = 1.2,
  dashed = false,
  alpha = 1
) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const segs = Math.max(6, Math.round(len / 12));
  const nx = -(y2 - y1) / Math.max(1, len);
  const ny = (x2 - x1) / Math.max(1, len);

  strokePasses(
    ctx,
    (pass) => {
      const pSeed = seed + pass * 4.3;
      for (let i = 0; i <= segs; i++) {
        if (dashed && i % 2 === 1) continue;
        const t = i / segs;
        const wave =
          Math.sin(t * Math.PI * 3 + pSeed) * wobbleAmp * 0.65 +
          Math.cos(t * Math.PI * 6 - pSeed) * wobbleAmp * 0.35;
        const px = x1 + (x2 - x1) * t + nx * wave;
        const py = y1 + (y2 - y1) * t + ny * wave;
        if (i === 0 || (dashed && i % 2 === 0)) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
    },
    color,
    lineWidth,
    alpha
  );
}

export function drawCrayonRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lineWidth = 1.8,
  seed = 1,
  wobbleAmp = 1.3,
  alpha = 1
) {
  drawCrayonLine(ctx, x, y, x + w, y, color, lineWidth, seed + 0.1, wobbleAmp, false, alpha);
  drawCrayonLine(ctx, x + w, y, x + w, y + h, color, lineWidth, seed + 1.2, wobbleAmp, false, alpha);
  drawCrayonLine(ctx, x + w, y + h, x, y + h, color, lineWidth, seed + 2.3, wobbleAmp, false, alpha);
  drawCrayonLine(ctx, x, y + h, x, y, color, lineWidth, seed + 3.4, wobbleAmp, false, alpha);
}

export function drawCrayonPaperBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tintColor: string
) {
  // Subtle diagonal wax crayon shading streaks across dark paper
  ctx.save();
  ctx.strokeStyle = tintColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.045;
  for (let offset = -h; offset < w + h; offset += 11) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + h * 0.55, h);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCrayonSweep(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sweepAngle: number,
  arcSpan: number,
  rgbaPrefix: string,
  beamColor: string
) {
  ctx.save();
  // Hand-scribbled radial crayon rays forming the sweep cone
  const rayCount = 14;
  ctx.lineCap = 'round';
  for (let i = 0; i < rayCount; i++) {
    const ratio = i / rayCount;
    const a = sweepAngle - ratio * arcSpan;
    const alpha = (1 - ratio) * 0.24;
    const jitterR = radius * (0.94 + 0.05 * Math.sin(i * 2.1));
    ctx.strokeStyle = `${rgbaPrefix} ${alpha.toFixed(3)})`;
    ctx.lineWidth = 3.2 - ratio * 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const midR = jitterR * 0.52;
    const perp = 2.4 * Math.sin(i * 3.3);
    ctx.quadraticCurveTo(
      cx + Math.cos(a) * midR - Math.sin(a) * perp,
      cy + Math.sin(a) * midR + Math.cos(a) * perp,
      cx + Math.cos(a) * jitterR,
      cy + Math.sin(a) * jitterR
    );
    ctx.stroke();
  }

  // Leading hand-drawn crayon sweep line
  drawCrayonLine(
    ctx,
    cx,
    cy,
    cx + Math.cos(sweepAngle) * radius,
    cy + Math.sin(sweepAngle) * radius,
    beamColor,
    2.2,
    5.5,
    1.2
  );
  ctx.restore();
}

export function drawCrayonDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fillColor: string,
  outlineColor: string,
  seed = 1
) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  drawCrayonCircle(ctx, x, y, r + 0.4, outlineColor, 1.4, seed, 0.7);
  ctx.restore();
}

export function drawCrayonDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfSize: number,
  fillColor: string,
  outlineColor: string
) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x, y - halfSize);
  ctx.lineTo(x + halfSize, y);
  ctx.lineTo(x, y + halfSize);
  ctx.lineTo(x - halfSize, y);
  ctx.closePath();
  ctx.fill();

  drawCrayonLine(ctx, x, y - halfSize, x + halfSize, y, outlineColor, 1.5, 1.1, 0.6);
  drawCrayonLine(ctx, x + halfSize, y, x, y + halfSize, outlineColor, 1.5, 2.2, 0.6);
  drawCrayonLine(ctx, x, y + halfSize, x - halfSize, y, outlineColor, 1.5, 3.3, 0.6);
  drawCrayonLine(ctx, x - halfSize, y, x, y - halfSize, outlineColor, 1.5, 4.4, 0.6);
  ctx.restore();
}

export function drawCrayonShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scale: number,
  fillColor: string,
  outlineColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(7.5, 0);
  ctx.lineTo(-5.5, -5);
  ctx.lineTo(-2.5, 0);
  ctx.lineTo(-5.5, 5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Subtle inner crayon stroke
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, 0);
  ctx.stroke();

  ctx.restore();
}
