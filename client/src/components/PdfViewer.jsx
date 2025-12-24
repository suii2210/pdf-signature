import { Document, Page } from "react-pdf";
import FieldBox from "./FieldBox";
import FieldContent from "./FieldContent";

const ViewerHeader = ({ pdfFile, fields, pageSizePt }) => {
  const pageSizeLabel = pageSizePt
    ? `${Math.round(pageSizePt.width)} x ${Math.round(pageSizePt.height)} pt`
    : "Loading...";

  return (
    <div className="viewer-header">
      <div>
        <h2>PDF Viewer</h2>
        <p>
          {pdfFile
            ? "Uploaded PDF with anchored fields."
            : "Sample A4 contract with anchored fields."}
        </p>
      </div>
      <div className="viewer-meta">
        <span>{fields.length} fields</span>
        <span>{pageSizeLabel}</span>
      </div>
    </div>
  );
};

export default function PdfViewer({
  pdfKey,
  pdfSource,
  onLoadSuccess,
  renderSizePx,
  pdfContainerRef,
  overlayRef,
  onDrop,
  onDragOver,
  fields = [],
  selectedFieldId,
  onFieldChange,
  onFieldRemove,
  onFieldSelect,
  signatureDataUrl,
  pdfFile,
  pageSizePt,
}) {
  return (
    <main className="viewer">
      <ViewerHeader pdfFile={pdfFile} fields={fields} pageSizePt={pageSizePt} />

      <div className="pdf-shell" ref={pdfContainerRef}>
        <Document
          key={pdfKey}
          file={pdfSource}
          onLoadSuccess={onLoadSuccess}
          loading={<div className="skeleton">Loading PDF...</div>}
        >
          {renderSizePx.width ? (
            <div
              className="page-stack"
              style={{
                width: `${renderSizePx.width}px`,
                height: `${renderSizePx.height}px`,
              }}
            >
              <Page
                pageNumber={1}
                width={Math.floor(renderSizePx.width)}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
              <div
                ref={overlayRef}
                className="field-layer"
                onDrop={onDrop}
                onDragOver={onDragOver}
                style={{
                  width: `${renderSizePx.width}px`,
                  height: `${renderSizePx.height}px`,
                }}
              >
                {fields.map((field) => (
                  <FieldBox
                    key={field.id}
                    field={field}
                    container={renderSizePx}
                    onChange={onFieldChange}
                    onRemove={onFieldRemove}
                    onSelect={onFieldSelect}
                    isSelected={selectedFieldId === field.id}
                  >
                    <FieldContent
                      field={field}
                      signatureDataUrl={signatureDataUrl}
                      onUpdateField={onFieldChange}
                    />
                  </FieldBox>
                ))}
              </div>
            </div>
          ) : (
            <div className="skeleton">Measuring canvas...</div>
          )}
        </Document>
      </div>
    </main>
  );
}
