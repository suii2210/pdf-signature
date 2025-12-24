import { useMemo, useState } from "react";
import { DEFAULT_SIZES_PCT } from "../constants/fields";
import { clamp, normalizeBox, toPdfBox } from "../utils/coords";

const createFieldId = () =>
  (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) ||
  `field-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export default function useFields({ renderSizePx, pageSizePt }) {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const updateField = (id, patch) => {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  };

  const removeField = (id) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
    setSelectedFieldId((current) => (current === id ? null : current));
  };

  const clearFields = () => {
    setFields([]);
    setSelectedFieldId(null);
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
    const id = createFieldId();
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

  return {
    fields,
    selectedFieldId,
    setSelectedFieldId,
    updateField,
    removeField,
    clearFields,
    addField,
    signatureField,
    signatureCoords,
  };
}
