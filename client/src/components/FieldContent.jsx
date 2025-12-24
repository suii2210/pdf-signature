export default function FieldContent({
  field,
  signatureDataUrl,
  onUpdateField,
}) {
  const updateField = onUpdateField || (() => {});

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
              if (typeof reader.result === "string") {
                updateField(field.id, { imageDataUrl: reader.result });
              }
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
}
