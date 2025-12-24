import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 220;

const getCanvasContext = (canvas) => {
  const ctx = canvas.getContext("2d");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  return ctx;
};

export default function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = getCanvasContext(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
      };
      img.src = value;
    } else {
      setIsEmpty(true);
    }

    
    return undefined;
  }, [value]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };



  const startDrawing = (event) => {
    event.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  };

  const draw = (event) => {
    if (!drawingRef.current) {
      return;
    }
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = getCanvasContext(canvas);
    const nextPoint = getPoint(event);
    const lastPoint = lastPointRef.current;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
    lastPointRef.current = nextPoint;
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = getCanvasContext(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
    setIsEmpty(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const loadSignatureFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    loadSignatureFile(file);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    loadSignatureFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    const hasFiles = Array.from(event.dataTransfer.types || []).includes("Files");
    if (!hasFiles) {
      setIsDraggingFile(false);
      return;
    }
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  return (
    <div className="signature-pad">
      <div
        className={`signature-canvas ${isDraggingFile ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        {isDraggingFile ? (
          <span className="signature-drop-hint">Drop signature image</span>
        ) : isEmpty ? (
          <span className="signature-hint">Draw here or drop an image</span>
        ) : null}
      </div>
      <div className="signature-actions">
        <button type="button" onClick={clear} className="ghost">
          Clear
        </button>
        <label className="ghost signature-upload">
          <input type="file" accept="image/*" onChange={handleUpload} />
          Upload
        </label>
        <button type="button" onClick={save}>
          Use signature
        </button>
      </div>
    </div>
  );
}
