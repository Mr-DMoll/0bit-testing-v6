// Cloudflare R2 (S3-compatible) file storage.
//
// Why this exists: uploads must land somewhere reachable from every
// environment and durable across deploys. Local disk fails both — a path
// like "http://localhost:3001/uploads/x.jpg" only resolves on the machine
// that uploaded it, and Railway's container filesystem is wiped on every
// redeploy. R2 gives every upload a stable public URL regardless of which
// environment (local dev or production) performed the upload.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import env from "../config/env.config.js";

export const isR2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME && env.R2_PUBLIC_URL,
);

const client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!client) throw new Error("R2 is not configured — set R2_* vars in .env.");

  await client.send(new PutObjectCommand({
    Bucket:      env.R2_BUCKET_NAME,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));

  return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}
