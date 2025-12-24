export const normalizedToPdfBox = (boxPct, pageSizePt) => {
  const widthPt = boxPct.wPct * pageSizePt.width;
  const heightPt = boxPct.hPct * pageSizePt.height;
  const xPt = boxPct.xPct * pageSizePt.width;
  const yTopPt = boxPct.yPct * pageSizePt.height;
  // PDF uses a bottom-left origin; convert top-left normalized Y to bottom-left.
  const yPt = pageSizePt.height - yTopPt - heightPt;

  return { xPt, yPt, widthPt, heightPt };
};
