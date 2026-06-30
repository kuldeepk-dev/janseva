const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

const MB = 1024 * 1024;

function createUpload({ fileLabel, maxFileSize, isAllowedMimeType }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize },
    fileFilter(req, file, cb) {
      if (!isAllowedMimeType(file.mimetype || "")) {
        const error = new Error(
          `${fileLabel} must be an image file${fileLabel === "Complaint attachment" ? " or PDF" : ""}.`,
        );
        error.statusCode = 400;
        cb(error);
        return;
      }

      cb(null, true);
    },
  });
}

function runUpload(middleware, req, res) {
  return new Promise((resolve, reject) => {
    middleware(req, res, err => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function isImageMimeType(mimeType) {
  return typeof mimeType === "string" && mimeType.startsWith("image/");
}

function isImageOrPdfMimeType(mimeType) {
  return isImageMimeType(mimeType) || mimeType === "application/pdf";
}

function toUploadErrorMessage(err, maxFileSize) {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return `File size must be ${Math.floor(maxFileSize / MB)}MB or smaller.`;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return "Upload failed.";
}

function getUploadErrorStatus(err) {
  if (err instanceof multer.MulterError) {
    return 400;
  }

  if (err && typeof err.statusCode === "number") {
    return err.statusCode;
  }

  return 500;
}

function registerEndpoint(app, fileStorage, config) {
  const upload = createUpload(config).single("file");

  app.post(config.path, requireAuth, async (req, res) => {
    try {
      await runUpload(upload, req, res);
      if (!req.file) {
        return res.status(400).send("Missing file.");
      }

      const uploaded = await fileStorage.saveFile(req.file, config.folder);
      return res.json({ url: uploaded.url, key: uploaded.key });
    } catch (err) {
      const statusCode = getUploadErrorStatus(err);
      const message =
        statusCode >= 500
          ? "Failed to store the uploaded file."
          : toUploadErrorMessage(err, config.maxFileSize);
      return res.status(statusCode).send(message);
    }
  });
}

function registerUploadRoutes(app, fileStorage) {
  registerEndpoint(app, fileStorage, {
    path: "/uploads/voter-photo",
    folder: "voter-photos",
    fileLabel: "Voter photo",
    maxFileSize: 8 * MB,
    isAllowedMimeType: isImageMimeType,
  });

  registerEndpoint(app, fileStorage, {
    path: "/uploads/complaint-attachment",
    folder: "complaint-attachments",
    fileLabel: "Complaint attachment",
    maxFileSize: 15 * MB,
    isAllowedMimeType: isImageOrPdfMimeType,
  });

  registerEndpoint(app, fileStorage, {
    path: "/uploads/social-post-image",
    folder: "social-post-images",
    fileLabel: "Social post image",
    maxFileSize: 10 * MB,
    isAllowedMimeType: isImageMimeType,
  });

  if (fileStorage.usesS3 && typeof fileStorage.getFile === "function") {
    app.get("/uploads/s3/*", async (req, res) => {
      const objectKey = decodeURIComponent(req.params[0] || "");
      if (!objectKey) {
        return res.status(400).send("Missing file key.");
      }

      try {
        const file = await fileStorage.getFile(objectKey);
        if (file.contentType) {
          res.setHeader("Content-Type", file.contentType);
        }
        if (file.contentLength) {
          res.setHeader("Content-Length", String(file.contentLength));
        }

        if (file.body && typeof file.body.pipe === "function") {
          file.body.pipe(res);
          return;
        }

        return res.status(500).send("Unsupported file stream.");
      } catch (err) {
        const statusCode = err?.$metadata?.httpStatusCode === 404 ? 404 : 500;
        return res.status(statusCode).send(
          statusCode === 404 ? "File not found." : "Failed to load uploaded file.",
        );
      }
    });
  }
}

module.exports = { registerUploadRoutes };
