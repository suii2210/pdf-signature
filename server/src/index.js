import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument } from "pdf-lib";
import SignatureAudit from "./models/SignatureAudit.js";
import { normalizedToPdfBox } from "./lib/coords.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_DIR = path.join(__dirname, "..", "pdfs");
const SIGNED_DIR = path.join(__dirname, "..", "storage");

const hashBuffer = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

const parseDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid signature data.");
  }
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
};

const parsePdfDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid PDF data.");
  }
  return Buffer.from(match[1], "base64");
};

const sanitizePdfName = (name) => {
  if (!name) {
    return "uploaded";
  }
  const base = path.parse(name).name;
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "uploaded";
};

const getPdfPath = (pdfId) => path.join(PDF_DIR, `${pdfId}.pdf`);

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not set; audit records will be skipped.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");
  } catch (error) {
    console.warn(`MongoDB connection failed: ${error.message}`);
  }
};

app.use("/signed", express.static(SIGNED_DIR));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/sign-pdf", async (req, res) => {
  try {
    const { pdfId, pdfDataUrl, pdfName, signatureDataUrl, coordinate } =
      req.body || {};
    if ((!pdfId && !pdfDataUrl) || !signatureDataUrl || !coordinate) {
      return res.status(400).json({
        error: "pdfId or pdfDataUrl, signatureDataUrl, and coordinate are required.",
      });
    }

    let originalBytes;
    let pdfLabel = pdfId;
    if (pdfDataUrl) {
      try {
        originalBytes = parsePdfDataUrl(pdfDataUrl);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
      pdfLabel = pdfName || "uploaded";
    } else {
      const pdfPath = getPdfPath(pdfId);
      try {
        originalBytes = await fs.readFile(pdfPath);
      } catch (error) {
        if (error.code === "ENOENT") {
          return res.status(404).json({ error: "PDF not found." });
        }
        throw error;
      }
    }
    const originalHash = hashBuffer(originalBytes);

    const pdfDoc = await PDFDocument.load(originalBytes);
    const pageIndex = Math.max(0, (coordinate.page || 1) - 1);
    const page = pdfDoc.getPage(pageIndex);
    const pageSize = page.getSize();

    const box = normalizedToPdfBox(coordinate, pageSize);
    const { mime, buffer } = parseDataUrl(signatureDataUrl);
    const image =
      mime === "image/png"
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);

    const imageSize = image.scale(1);
    const scale = Math.min(
      box.widthPt / imageSize.width,
      box.heightPt / imageSize.height
    );
    const drawWidth = imageSize.width * scale;
    const drawHeight = imageSize.height * scale;
    const drawX = box.xPt + (box.widthPt - drawWidth) / 2;
    const drawY = box.yPt + (box.heightPt - drawHeight) / 2;

    page.drawImage(image, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });

    const signedBytes = await pdfDoc.save();
    const signedHash = hashBuffer(signedBytes);

    await fs.mkdir(SIGNED_DIR, { recursive: true });
    const fileName = `${sanitizePdfName(pdfLabel)}-signed-${Date.now()}.pdf`;
    const filePath = path.join(SIGNED_DIR, fileName);
    await fs.writeFile(filePath, signedBytes);

    if (mongoose.connection.readyState === 1) {
      await SignatureAudit.create({
        pdfId: pdfId || pdfLabel,
        originalHash,
        signedHash,
        coordinate,
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json({
      url: `${baseUrl}/signed/${fileName}`,
      originalHash,
      signedHash,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

const start = async () => {
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
};

start();
