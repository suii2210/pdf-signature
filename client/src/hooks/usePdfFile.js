import { useState } from "react";
import { isPdfFile } from "../utils/pdf";

export default function usePdfFile({ onInvalidFile, onPdfChange } = {}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [isPdfDragging, setIsPdfDragging] = useState(false);

  const pdfSource = pdfFile || "/sample.pdf";
  const pdfKey = pdfFile
    ? `${pdfFile.name}-${pdfFile.lastModified}`
    : "sample-pdf";

  const handlePdfFile = (file) => {
    if (!file) {
      return;
    }
    if (!isPdfFile(file)) {
      if (onInvalidFile) {
        onInvalidFile("Please upload a PDF file.");
      }
      return;
    }
    setPdfFile(file);
    if (onPdfChange) {
      onPdfChange();
    }
  };

  const handlePdfInput = (event) => {
    handlePdfFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handlePdfDragOver = (event) => {
    event.preventDefault();
    const hasFiles = Array.from(event.dataTransfer.types || []).includes("Files");
    if (!hasFiles) {
      setIsPdfDragging(false);
      return;
    }
    event.dataTransfer.dropEffect = "copy";
    setIsPdfDragging(true);
  };

  const handlePdfDragLeave = () => {
    setIsPdfDragging(false);
  };

  const handlePdfDrop = (event) => {
    event.preventDefault();
    setIsPdfDragging(false);
    handlePdfFile(event.dataTransfer.files?.[0]);
  };

  return {
    pdfFile,
    pdfSource,
    pdfKey,
    isPdfDragging,
    handlePdfFile,
    handlePdfInput,
    handlePdfDragOver,
    handlePdfDragLeave,
    handlePdfDrop,
  };
}
