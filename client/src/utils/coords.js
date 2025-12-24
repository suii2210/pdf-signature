export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const normalizeBox = (boxPx, containerPx) => {
  if (!containerPx.width || !containerPx.height) {
    return { xPct: 0, yPct: 0, wPct: 0, hPct: 0 };
  }
  return {
    xPct: boxPx.x / containerPx.width,
    yPct: boxPx.y / containerPx.height,
    wPct: boxPx.width / containerPx.width,
    hPct: boxPx.height / containerPx.height,
  };
};

export const denormalizeBox = (boxPct, containerPx) => {
  return {
    x: boxPct.xPct * containerPx.width,
    y: boxPct.yPct * containerPx.height,
    width: boxPct.wPct * containerPx.width,
    height: boxPct.hPct * containerPx.height,
  };
};

export const toPdfBox = (boxPct, pagePt) => {
  const widthPt = boxPct.wPct * pagePt.width;
  const heightPt = boxPct.hPct * pagePt.height;
  const xPt = boxPct.xPct * pagePt.width;
  const yTopPt = boxPct.yPct * pagePt.height;
  const yPt = pagePt.height - yTopPt - heightPt;

  return { xPt, yPt, widthPt, heightPt };
};
