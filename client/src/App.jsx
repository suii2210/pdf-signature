import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import FieldBox from "./components/FieldBox";
import SignaturePad from "./components/SignaturePad";
import { clamp, normalizeBox, toPdfBox } from "./utils/coords";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const FIELD_TYPES = [{ type: "signature", label: "Signature" }];

const DEFAULT_SIZES_PCT = {
  signature: { w: 0.34, h: 0.12 },
};

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }
  const name = file.name ? file.name.toLowerCase() : "";
  return file.type === "application/pdf" || name.endsWith(".pdf");
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const parts = reader.result.split(",");
        if (parts.length < 2) {
          reject(new Error("Unable to read the PDF file."));
          return;
        }
        const base64 = parts.slice(1).join(",");
        const dataUrl = reader.result.startsWith("data:application/pdf;base64,")
          ? reader.result
          : `data:application/pdf;base64,${base64}`;
        resolve(dataUrl);
        return;
      }
      reject(new Error("Unable to read the PDF file."));
    };
    reader.onerror = () => reject(new Error("Unable to read the PDF file."));
    reader.readAsDataURL(file);
  });

export default function App() {
  const [pageSizePt, setPageSizePt] = useState(null);
  const [renderSizePx, setRenderSizePx] = useState({ width: 0, height: 0 });
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [isPdfDragging, setIsPdfDragging] = useState(false);

  const overlayRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const pdfSource = pdfFile || "/sample.pdf";
  const pdfKey = pdfFile
    ? `${pdfFile.name}-${pdfFile.lastModified}`
    : "sample-pdf";

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

  const resetForPdfChange = () => {
    setFields([]);
    setSelectedFieldId(null);
    setSignedUrl("");
    setStatus("");
    setPageSizePt(null);
    setRenderSizePx({ width: 0, height: 0 });
  };

  const handlePdfFile = (file) => {
    if (!file) {
      return;
    }
    if (!isPdfFile(file)) {
      setStatus("Please upload a PDF file.");
      return;
    }
    setPdfFile(file);
    resetForPdfChange();
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

  const updateField = (id, patch) => {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  };

  const removeField = (id) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const addField = (type, xPx, yPx) => {
    if (!renderSizePx.width || !renderSizePx.height) {
      return;
    }
    const size = DEFAULT_SIZES_PCT[type] || DEFAULT_SIZES_PCT.signature;
    const widthPx = size.w * renderSizePx.width;
    const heightPx = size.h * renderSizePx.height;
    const boundedX = clamp(xPx - widthPx / 2, 0, renderSizePx.width - widthPx);
    const boundedY = clamp(yPx - heightPx / 2, 0, renderSizePx.height - heightPx);
    const normalized = normalizeBox(
      { x: boundedX, y: boundedY, width: widthPx, height: heightPx },
      renderSizePx
    );
    const id =
      (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) ||
      `field-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    setFields((prev) => [
      ...prev,
      {
        id,
        type,
        ...normalized,
        value: "",
        checked: false,
        imageDataUrl: "",
      },
    ]);
    setSelectedFieldId(id);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && isPdfFile(file)) {
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

  const signatureField = useMemo(() => {
    if (!fields.length) {
      return null;
    }
    const selected =
      fields.find(
        (field) => field.id === selectedFieldId && field.type === "signature"
      ) || null;
    return selected || fields.find((field) => field.type === "signature") || null;
  }, [fields, selectedFieldId]);

  const signatureCoords = useMemo(() => {
    if (!signatureField || !pageSizePt) {
      return null;
    }
    return toPdfBox(signatureField, pageSizePt);
  }, [signatureField, pageSizePt]);

  const signPdf = async () => {
    if (!signatureField) {
      setStatus("Drop a signature field onto the PDF.");
      return;
    }
    if (!signatureDataUrl) {
      setStatus("Draw a signature first.");
      return;
    }
    setIsSigning(true);
    setStatus("Signing...");
    setSignedUrl("");

    try {
      const payload = {
        signatureDataUrl,
        coordinate: {
          page: 1,
          xPct: signatureField.xPct,
          yPct: signatureField.yPct,
          wPct: signatureField.wPct,
          hPct: signatureField.hPct,
          pageSize: pageSizePt,
        },
      };

      if (pdfFile) {
        payload.pdfDataUrl = await readFileAsDataUrl(pdfFile);
        payload.pdfName = pdfFile.name;
      } else {
        payload.pdfId = "sample";
      }

      const response = await fetch(`${apiUrl}/sign-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Signing failed.");
      }

      const data = await response.json();
      setSignedUrl(data.url);
      setStatus("Signed PDF ready.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSigning(false);
    }
  };

  const renderFieldContent = (field) => {
    if (field.type === "text") {
      return (
        <input
          type="text"
          placeholder="Enter text"
          value={field.value}
          onChange={(event) =>
            updateField(field.id, { value: event.target.value })
          }
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          value={field.value}
          onChange={(event) =>
            updateField(field.id, { value: event.target.value })
          }
        />
      );
    }

    if (field.type === "radio") {
      return (
        <label className="radio-field">
          <input
            type="radio"
            checked={field.checked}
            onChange={(event) =>
              updateField(field.id, { checked: event.target.checked })
            }
          />
          <span>Select</span>
        </label>
      );
    }

    if (field.type === "image") {
      return (
        <label className="image-field">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                updateField(field.id, { imageDataUrl: reader.result });
              };
              reader.readAsDataURL(file);
            }}
          />
          {field.imageDataUrl ? (
            <img src={field.imageDataUrl} alt="Uploaded" />
          ) : (
            <span>Upload image</span>
          )}
        </label>
      );
    }

    if (field.type === "signature") {
      return signatureDataUrl ? (
        <img src={signatureDataUrl} alt="Signature preview" />
      ) : (
        <span>Signature</span>
      );
    }

    return null;
  };

  return (
    <div className="app">
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
          <div
            className={`pdf-upload ${isPdfDragging ? "dragging" : ""}`}
            onDragOver={handlePdfDragOver}
            onDragLeave={handlePdfDragLeave}
            onDrop={handlePdfDrop}
          >
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handlePdfInput}
            />
            <label htmlFor="pdf-upload">Upload PDF</label>
            <span className="pdf-upload-hint">or drop a PDF here</span>
            <span className="pdf-upload-name">
              {pdfFile ? pdfFile.name : "sample.pdf"}
            </span>
          </div>
        </section>

        <section>
          <h2>Fields</h2>
          <div className="field-list">
            {FIELD_TYPES.map((field) => (
              <div
                key={field.type}
                className="field-tile"
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData(
                    "application/x-bolo-field",
                    field.type
                  )
                }
              >
                <span>{field.label}</span>
                <span className="field-pill">Drag</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Signature Pad</h2>
          <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
        </section>

        <section className="actions">
          <button
            type="button"
            onClick={signPdf}
            disabled={isSigning || !signatureDataUrl || !signatureField}
          >
            {isSigning ? "Signing..." : "Sign PDF"}
          </button>
          {signedUrl ? (
            <a className="link" href={signedUrl} target="_blank" rel="noreferrer">
              Open signed PDF
            </a>
          ) : null}
          {status ? <p className="status">{status}</p> : null}
        </section>

        <section>
          <h2>Coordinate Debug</h2>
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
        </section>
      </aside>

      <main className="viewer">
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
            <span>
              {pageSizePt
                ? `${Math.round(pageSizePt.width)} x ${Math.round(
                    pageSizePt.height
                  )} pt`
                : "Loading..."}
            </span>
          </div>
        </div>

        <div className="pdf-shell" ref={pdfContainerRef}>
          <Document
            key={pdfKey}
            file={pdfSource}
            onLoadSuccess={handleDocumentLoad}
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
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
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
                      onChange={(id, patch) => updateField(id, patch)}
                      onRemove={removeField}
                      onSelect={setSelectedFieldId}
                      isSelected={selectedFieldId === field.id}
                    >
                      {renderFieldContent(field)}
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
    </div>
  );
}
