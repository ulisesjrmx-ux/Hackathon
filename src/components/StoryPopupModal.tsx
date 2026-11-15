import React, { useEffect, useState } from 'react';

interface StoryPopupModalProps {
  imageUrl: string;
  alt: string;
  onExit: () => void;
}

function removeWhiteBackgroundToDataUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      try {
        const maxDim = 1500;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const work = document.createElement('canvas');
        work.width = w;
        work.height = h;
        const ctx = work.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const isNearWhite = (idx: number) => {
          const p = idx * 4;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          return r > 224 && g > 224 && b > 224 && max - min < 28;
        };

        const enqueue = (x: number, y: number) => {
          if (x < 0 || x >= w || y < 0 || y >= h) return;
          const idx = y * w + x;
          if (visited[idx] || !isNearWhite(idx)) return;
          visited[idx] = 1;
          queue[tail++] = idx;
        };

        // 1. Flood-fill outer white backdrop from all edges
        for (let x = 0; x < w; x++) {
          enqueue(x, 0);
          enqueue(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          enqueue(0, y);
          enqueue(w - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          data[idx * 4 + 3] = 0;
          const x = idx % w;
          const y = (idx - x) / w;
          enqueue(x + 1, y);
          enqueue(x - 1, y);
          enqueue(x, y + 1);
          enqueue(x, y - 1);
        }

        // 2. Clear enclosed white gaps inside the central spiral spine column
        const spineMinX = Math.floor(w * 0.42);
        const spineMaxX = Math.ceil(w * 0.56);
        const compQueue = new Int32Array(w * h);
        for (let y = 0; y < h; y++) {
          for (let x = spineMinX; x <= spineMaxX; x++) {
            const startIdx = y * w + x;
            if (visited[startIdx] || !isNearWhite(startIdx)) continue;
            let cHead = 0;
            let cTail = 0;
            visited[startIdx] = 1;
            compQueue[cTail++] = startIdx;

            while (cHead < cTail) {
              const idx = compQueue[cHead++];
              const cx = idx % w;
              const cy = (idx - cx) / w;
              const neighbors = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
              ];
              for (let n = 0; n < 4; n++) {
                const nx = neighbors[n][0];
                const ny = neighbors[n][1];
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const nIdx = ny * w + nx;
                if (!visited[nIdx] && isNearWhite(nIdx)) {
                  visited[nIdx] = 1;
                  compQueue[cTail++] = nIdx;
                }
              }
            }

            // Only clear genuine spine gap cutouts (skip tiny decorative flecks)
            if (cTail > 80) {
              for (let k = 0; k < cTail; k++) {
                data[compQueue[k] * 4 + 3] = 0;
              }
            }
          }
        }

        // 3. Gentle anti-aliased fringe softening along transparent edges
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const p = idx * 4;
            if (data[p + 3] === 0) continue;
            const adjCleared =
              data[(idx - 1) * 4 + 3] === 0 ||
              data[(idx + 1) * 4 + 3] === 0 ||
              data[(idx - w) * 4 + 3] === 0 ||
              data[(idx + w) * 4 + 3] === 0;
            if (adjCleared) {
              const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
              const sat =
                Math.max(data[p], data[p + 1], data[p + 2]) -
                Math.min(data[p], data[p + 1], data[p + 2]);
              if (lum > 205 && sat < 35) {
                data[p + 3] = Math.max(0, Math.round((245 - lum) * 4));
              }
            }
          }
        }

        // 4. Tight crop around remaining artwork
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 18) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const bw = Math.max(1, maxX - minX + 1);
        const bh = Math.max(1, maxY - minY + 1);
        const cropped = document.createElement('canvas');
        cropped.width = bw;
        cropped.height = bh;
        const cCtx = cropped.getContext('2d');
        if (!cCtx) {
          resolve(src);
          return;
        }
        cCtx.drawImage(work, minX, minY, bw, bh, 0, 0, bw, bh);
        resolve(cropped.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
  });
}

export const StoryPopupModal: React.FC<StoryPopupModalProps> = ({
  imageUrl,
  alt,
  onExit,
}) => {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setProcessedUrl(null);
    removeWhiteBackgroundToDataUrl(imageUrl).then((res) => {
      if (active) setProcessedUrl(res);
    });
    return () => {
      active = false;
    };
  }, [imageUrl]);

  return (
    <div className="absolute inset-0 z-20 bg-[#07090E]/82 backdrop-blur-xs flex flex-col items-center justify-center p-4 gap-4">
      {processedUrl && (
        <img
          src={processedUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          className="max-w-[92%] max-h-[76vh] w-auto h-auto object-contain select-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.75)]"
        />
      )}

      <button
        type="button"
        onClick={onExit}
        className="crayon-btn crayon-btn-amber inline-flex items-center justify-center px-8 py-2.5 text-base font-bold whitespace-nowrap shrink-0 cursor-pointer"
      >
        Salir
      </button>
    </div>
  );
};
