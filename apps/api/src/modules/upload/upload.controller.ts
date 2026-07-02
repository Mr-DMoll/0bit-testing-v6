import { Request, Response } from "express";
import path from "path";
import { catchAsync } from "../../utils/catchAsync.js";
import { isR2Configured, uploadToR2 } from "../../services/s3.service.js";

export const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ status: "fail", message: "No file uploaded." });
  }

  if (isR2Configured) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const url = await uploadToR2(req.file.buffer, key, req.file.mimetype);
    return res.json({ status: "success", data: { url } });
  }

  // Local-disk fallback (dev convenience only — not durable, and only
  // reachable from this machine; see the warning logged in upload.routes.ts).
  const port = process.env.PORT || 3001;
  const API_URL = process.env.API_URL || `http://localhost:${port}`;
  const url = `${API_URL}/uploads/${req.file.filename}`;
  res.json({ status: "success", data: { url } });
});
