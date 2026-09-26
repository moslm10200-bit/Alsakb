const express = require("express");
const path = require("path");
const app = express();

app.use(express.json({ limit: "7mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    translationEngine: process.env.ELEVENLABS_API_KEY ? "configured" : "missing-api-key"
  });
});

app.post("/api/translate", (_req, res) => {
  res.status(501).json({
    message:
      "للتشغيل المحلي استخدم Netlify Functions، أو انشر الموقع على Netlify مع ELEVENLABS_API_KEY."
  });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Alsakb is running on port ${port}`);
});