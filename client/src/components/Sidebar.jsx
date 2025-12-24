import ActionsPanel from "./ActionsPanel";
import CoordinateDebug from "./CoordinateDebug";
import FieldPalette from "./FieldPalette";
import PdfUpload from "./PdfUpload";
import SignaturePad from "./SignaturePad";

export default function Sidebar({
  fieldTypes,
  isPdfDragging,
  pdfFileName,
  onPdfInput,
  onPdfDragOver,
  onPdfDragLeave,
  onPdfDrop,
  onFieldDragStart,
  signatureDataUrl,
  onSignatureChange,
  onSign,
  isSigning,
  canSign,
  signedUrl,
  status,
  signatureField,
  pageSizePt,
  signatureCoords,
}) {
  return (
    <aside className="toolbar">
      <header>
        <p className="eyebrow">Prototype</p>
        <h1>Signature Injection Engine</h1>
        <p className="subtitle">
          Drag fields onto the PDF. Positions stay anchored using normalized
          coordinates so resizing the viewport does not shift intent.
        </p>
      </header>

      <section>
        <h2>PDF Source</h2>
        <PdfUpload
          isDragging={isPdfDragging}
          pdfFileName={pdfFileName}
          onInput={onPdfInput}
          onDragOver={onPdfDragOver}
          onDragLeave={onPdfDragLeave}
          onDrop={onPdfDrop}
        />
      </section>

      <section>
        <h2>Fields</h2>
        <FieldPalette fieldTypes={fieldTypes} onDragStart={onFieldDragStart} />
      </section>

      <section>
        <h2>Signature Pad</h2>
        <SignaturePad value={signatureDataUrl} onChange={onSignatureChange} />
      </section>

      <section className="actions">
        <ActionsPanel
          onSign={onSign}
          isSigning={isSigning}
          canSign={canSign}
          signedUrl={signedUrl}
          status={status}
        />
      </section>

      <section>
        <h2>Coordinate Debug</h2>
        <CoordinateDebug
          signatureField={signatureField}
          pageSizePt={pageSizePt}
          signatureCoords={signatureCoords}
        />
      </section>
    </aside>
  );
}
