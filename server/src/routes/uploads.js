const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

function createUpload(storage) {
  return multer({ storage });
}

function registerUploadRoutes(app, upload, { BASE_URL }) {
  app.post("/uploads/voter-photo", requireAuth, upload.single("file"), (req, res) => {
    const url = `${BASE_URL}/uploads/${req.file.filename}`;
    return res.json({ url });
  });

  app.post("/uploads/complaint-attachment", requireAuth, upload.single("file"), (req, res) => {
    const url = `${BASE_URL}/uploads/${req.file.filename}`;
    return res.json({ url });
  });

  app.post("/uploads/social-post-image", requireAuth, upload.single("file"), (req, res) => {
    const url = `${BASE_URL}/uploads/${req.file.filename}`;
    return res.json({ url });
  });
}

module.exports = { createUpload, registerUploadRoutes };
