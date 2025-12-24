import { useEffect, useRef, useState } from "react";

export default function usePdfLayout() {
  const [pageSizePt, setPageSizePt] = useState(null);
  const [renderSizePx, setRenderSizePx] = useState({ width: 0, height: 0 });
  const pdfContainerRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!pdfContainerRef.current || !pageSizePt) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = width * (pageSizePt.height / pageSizePt.width);
      setRenderSizePx({ width, height });
    });

    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, [pageSizePt]);

  const handleDocumentLoad = async (pdf) => {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    setPageSizePt({ width: viewport.width, height: viewport.height });
  };

  const resetLayout = () => {
    setPageSizePt(null);
    setRenderSizePx({ width: 0, height: 0 });
  };

  return {
    pageSizePt,
    renderSizePx,
    pdfContainerRef,
    overlayRef,
    handleDocumentLoad,
    resetLayout,
  };
}
