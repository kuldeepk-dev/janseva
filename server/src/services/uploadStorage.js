const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const MIME_EXTENSION_MAP = {
  "application/pdf": ".pdf",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function ensureLocalUploadsDir(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function encodeObjectKey(key) {
  return key
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
}

function getFileExtension(file) {
  const originalExtension = path.extname(file.originalname || "").toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  return MIME_EXTENSION_MAP[file.mimetype] || "";
}

function buildObjectKey(folder, file) {
  const extension = getFileExtension(file);
  return `${folder}/${Date.now()}-${randomUUID()}${extension}`;
}

function buildS3ObjectUrl(env, key) {
  return `${env.BASE_URL}/uploads/s3/${encodeObjectKey(key)}`;
}

function buildDirectS3ObjectUrl(env, key) {
  const encodedKey = encodeObjectKey(key);
  if (env.AWS_S3_PUBLIC_BASE_URL) {
    return `${env.AWS_S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${encodedKey}`;
  }

  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${encodedKey}`;
}

function createS3Client(env) {
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function createLocalStorage(env) {
  return {
    usesS3: false,
    async saveFile(file, folder) {
      const key = buildObjectKey(folder, file);
      const outputPath = path.join(env.UPLOADS_DIR, ...key.split("/"));
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.promises.writeFile(outputPath, file.buffer);

      return {
        key,
        url: `${env.BASE_URL}/uploads/${encodeObjectKey(key)}`,
      };
    },
  };
}

function createS3Storage(env) {
  const s3Client = createS3Client(env);

  return {
    usesS3: true,
    async saveFile(file, folder) {
      const key = buildObjectKey(folder, file);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return {
        key,
        url: buildS3ObjectUrl(env, key),
        directUrl: buildDirectS3ObjectUrl(env, key),
      };
    },
    async getFile(key) {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
        }),
      );

      return {
        body: result.Body,
        contentLength: result.ContentLength ?? null,
        contentType: result.ContentType ?? "application/octet-stream",
      };
    },
  };
}

function createFileStorage(env) {
  const s3ConfigValues = [
    env.AWS_REGION,
    env.AWS_ACCESS_KEY_ID,
    env.AWS_SECRET_ACCESS_KEY,
    env.AWS_S3_BUCKET,
  ];
  const configuredCount = s3ConfigValues.filter(Boolean).length;

  if (configuredCount > 0 && configuredCount < s3ConfigValues.length) {
    throw new Error(
      "Incomplete AWS S3 configuration. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.",
    );
  }

  if (configuredCount === s3ConfigValues.length) {
    return createS3Storage(env);
  }

  return createLocalStorage(env);
}

module.exports = {
  createFileStorage,
  ensureLocalUploadsDir,
};
