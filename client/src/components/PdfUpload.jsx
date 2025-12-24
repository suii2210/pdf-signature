export default function PdfUpload({
  isDragging,
  pdfFileName,
  onInput,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  return (
    <div
      className={`pdf-upload ${isDragging ? "dragging" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        id="pdf-upload"
        type="file"
        accept="application/pdf"
        onChange={onInput}
      />
      <label htmlFor="pdf-upload">Upload PDF</label>
      <span className="pdf-upload-hint">or drop a PDF here</span>
      <span className="pdf-upload-name">{pdfFileName || "sample.pdf"}</span>
    </div>
  );
}
