import mongoose from "mongoose";

const SignatureAuditSchema = new mongoose.Schema(
  {
    pdfId: { type: String, required: true },
    originalHash: { type: String, required: true },
    signedHash: { type: String, required: true },
    coordinate: {
      page: { type: Number, default: 1 },
      xPct: Number,
      yPct: Number,
      wPct: Number,
      hPct: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SignatureAudit", SignatureAuditSchema);
