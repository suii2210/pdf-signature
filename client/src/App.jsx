import { useState } from "react";
import PdfViewer from "./components/PdfViewer";
import Sidebar from "./components/Sidebar";
import { FIELD_TYPES } from "./constants/fields";
import useFields from "./hooks/useFields";
import usePdfFile from "./hooks/usePdfFile";
import usePdfLayout from "./hooks/usePdfLayout";
import useSignPdf from "./hooks/useSignPdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export default function App() {
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [status, setStatus] = useState("");
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const {
    pageSizePt,
    renderSizePx,
    pdfContainerRef,
    overlayRef,
    handleDocumentLoad,
    resetLayout,
  } = usePdfLayout();

  const {
    fields,
    selectedFieldId,
    setSelectedFieldId,
    updateField,
    removeField,
    clearFields,
    addField,
    signatureField,
    signatureCoords,
  } = useFields({ renderSizePx, pageSizePt });

  const resetForPdfChange = () => {
    clearFields();
    resetLayout();
    resetSigning();
    setStatus("");
  };

  const {
    pdfFile,
    isPdfDragging,
    pdfSource,
    pdfKey,
    handlePdfFile,
    handlePdfInput,
    handlePdfDragOver,
    handlePdfDragLeave,
    handlePdfDrop,
  } = usePdfFile({
    onInvalidFile: setStatus,
    onPdfChange: resetForPdfChange,
  });

  const { signedUrl, isSigning, signPdf, resetSigning } = useSignPdf({
    apiUrl,
    pdfFile,
    signatureField,
    signatureDataUrl,
    pageSizePt,
    onStatus: setStatus,
  });

  const handleFieldDragStart = (event, type) => {
    event.dataTransfer.setData("application/x-bolo-field", type);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handlePdfFile(file);
      return;
    }
    const type = event.dataTransfer.getData("application/x-bolo-field");
    if (!type || !overlayRef.current) {
      return;
    }
    const rect = overlayRef.current.getBoundingClientRect();
    const xPx = event.clientX - rect.left;
    const yPx = event.clientY - rect.top;
    addField(type, xPx, yPx);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const canSign = Boolean(signatureDataUrl && signatureField);

  return (
    <div className="app">
      <Sidebar
        fieldTypes={FIELD_TYPES}
        isPdfDragging={isPdfDragging}
        pdfFileName={pdfFile?.name}
        onPdfInput={handlePdfInput}
        onPdfDragOver={handlePdfDragOver}
        onPdfDragLeave={handlePdfDragLeave}
        onPdfDrop={handlePdfDrop}
        onFieldDragStart={handleFieldDragStart}
        signatureDataUrl={signatureDataUrl}
        onSignatureChange={setSignatureDataUrl}
        onSign={signPdf}
        isSigning={isSigning}
        canSign={canSign}
        signedUrl={signedUrl}
        status={status}
        signatureField={signatureField}
        pageSizePt={pageSizePt}
        signatureCoords={signatureCoords}
      />
      <PdfViewer
        pdfKey={pdfKey}
        pdfSource={pdfSource}
        onLoadSuccess={handleDocumentLoad}
        renderSizePx={renderSizePx}
        pdfContainerRef={pdfContainerRef}
        overlayRef={overlayRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        fields={fields}
        selectedFieldId={selectedFieldId}
        onFieldChange={updateField}
        onFieldRemove={removeField}
        onFieldSelect={setSelectedFieldId}
        signatureDataUrl={signatureDataUrl}
        pdfFile={pdfFile}
        pageSizePt={pageSizePt}
      />
    </div>
  );
}
