import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || "us-east-1";
const bucket = process.env.S3_BUCKET || "";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export function objectKey(
  purpose: "in" | "out",
  userId: string,
  ext = "jpg"
): string {
  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
  return `attendance/${purpose}/${userId}/${ts}.${ext}`;
}

export async function uploadObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getObject(key: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const data = await result.Body?.transformToByteArray();
  return {
    body: Buffer.from(data || []),
    contentType: result.ContentType || "application/octet-stream",
  };
}