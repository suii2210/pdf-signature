export default function CoordinateDebug({
  signatureField,
  pageSizePt,
  signatureCoords,
}) {
  return (
    <pre className="coord-panel">
      {signatureField && pageSizePt
        ? JSON.stringify(
            {
              pageSizePt,
              normalized: {
                xPct: signatureField.xPct,
                yPct: signatureField.yPct,
                wPct: signatureField.wPct,
                hPct: signatureField.hPct,
              },
              pdfPoints: signatureCoords,
            },
            null,
            2
          )
        : "Drop a signature field to see coordinates."}
    </pre>
  );
}
