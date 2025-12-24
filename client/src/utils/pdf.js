export const isPdfFile = (file) => {
  if (!file) {
    return false;
  }
  const name = file.name ? file.name.toLowerCase() : "";
  return file.type === "application/pdf" || name.endsWith(".pdf");
};

export const readFileAsDataUrl = (file) =>
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
