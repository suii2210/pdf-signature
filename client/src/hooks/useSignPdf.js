import { useState } from "react";
import { readFileAsDataUrl } from "../utils/pdf";

export default function useSignPdf({
  apiUrl,
  pdfFile,
  signatureField,
  signatureDataUrl,
  pageSizePt,
  onStatus,
}) {
  const [signedUrl, setSignedUrl] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const resetSigning = () => {
    setSignedUrl("");
    setIsSigning(false);
  };

  const signPdf = async () => {
    if (!signatureField) {
      if (onStatus) {
        onStatus("Drop a signature field onto the PDF.");
      }
      return;
    }
    if (!signatureDataUrl) {
      if (onStatus) {
        onStatus("Draw a signature first.");
      }
      return;
    }
    setIsSigning(true);
    if (onStatus) {
      onStatus("Signing...");
    }
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
      if (onStatus) {
        onStatus("Signed PDF ready.");
      }
    } catch (error) {
      if (onStatus) {
        onStatus(error.message);
      }
    } finally {
      setIsSigning(false);
    }
  };

  return { signedUrl, isSigning, signPdf, resetSigning };
}
