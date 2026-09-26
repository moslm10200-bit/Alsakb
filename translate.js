const API_BASE = "https://api.elevenlabs.io";

function requireApiKey() {
  if (!process.env.ELEVENLABS_API_KEY) {
    const error = new Error("لم تتم إضافة ELEVENLABS_API_KEY في إعدادات Netlify بعد.");
    error.statusCode = 503;
    throw error;
  }
  return process.env.ELEVENLABS_API_KEY;
}

function parseErrorBody(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed.detail?.[0]?.msg || parsed.detail || parsed.message || text;
  } catch {
    return text;
  }
}

async function assertOk(response, fallbackMessage) {
  if (response.ok) return;
  const body = await response.text();
  const error = new Error(parseErrorBody(body) || fallbackMessage);
  error.statusCode = response.status;
  throw error;
}

function dataUrlToBuffer(dataUrl) {
  const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(dataUrl || "");
  if (!match) {
    const error = new Error("صيغة الصوت المرسل غير صالحة.");
    error.statusCode = 400;
    throw error;
  }
  return {
    contentType: match[1] || "audio/webm",
    buffer: Buffer.from(match[2], "base64")
  };
}

async function createDubbing({ audioDataUrl, fileName, sourceLanguage, targetLanguage }) {
  const { contentType, buffer } = dataUrlToBuffer(audioDataUrl);
  if (!buffer.length) {
    const error = new Error("التسجيل فارغ.");
    error.statusCode = 400;
    throw error;
  }
  if (buffer.length > 5 * 1024 * 1024) {
    const error = new Error("التسجيل كبير جدًا للنسخة الحالية. استخدم تسجيلًا قصيرًا.");
    error.statusCode = 413;
    throw error;
  }

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: contentType }), fileName || "alsakb-recording.webm");
  form.append("target_lang", targetLanguage);
  form.append("num_speakers", "1");
  form.append("watermark", "false");
  if (sourceLanguage && sourceLanguage !== "auto") {
    form.append("source_lang", sourceLanguage);
  }

  const response = await fetch(`${API_BASE}/v1/dubbing`, {
    method: "POST",
    headers: { "xi-api-key": requireApiKey() },
    body: form
  });
  await assertOk(response, "تعذّر إنشاء مهمة ترجمة الصوت.");
  return response.json();
}

async function getDubbing(dubbingId) {
  const response = await fetch(`${API_BASE}/v1/dubbing/${encodeURIComponent(dubbingId)}`, {
    headers: { "xi-api-key": requireApiKey() }
  });
  await assertOk(response, "تعذّر قراءة حالة مهمة الترجمة.");
  return response.json();
}

async function getDubbedAudio(dubbingId, language) {
  const response = await fetch(
    `${API_BASE}/v1/dubbing/${encodeURIComponent(dubbingId)}/audio/${encodeURIComponent(language)}`,
    { headers: { "xi-api-key": requireApiKey() } }
  );
  await assertOk(response, "لم يجهز الصوت المترجم بعد.");
  return {
    contentType: response.headers.get("content-type") || "audio/mpeg",
    buffer: Buffer.from(await response.arrayBuffer())
  };
}

function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(204, {});
  }

  try {
    const query = event.queryStringParameters || {};
    const action = query.action || "create";

    if (action === "status") {
      if (!query.jobId) return response(400, { message: "معرّف مهمة الترجمة مفقود." });
      const project = await getDubbing(query.jobId);
      return response(200, {
        jobId: project.dubbing_id || query.jobId,
        status: project.status,
        error: project.error || null
      });
    }

    if (action === "audio") {
      if (!query.jobId || !query.language) {
        return response(400, { message: "بيانات الصوت المترجم ناقصة." });
      }
      const audio = await getDubbedAudio(query.jobId, query.language);
      return {
        statusCode: 200,
        isBase64Encoded: true,
        headers: {
          "Content-Type": audio.contentType,
          "Content-Disposition": 'inline; filename="alsakb-translated.mp3"',
          "Cache-Control": "no-store"
        },
        body: audio.buffer.toString("base64")
      };
    }

    const body = JSON.parse(event.body || "{}");
    if (!body.audioDataUrl || !body.targetLanguage) {
      return response(400, { message: "أرسل التسجيل واللغة المطلوبة." });
    }

    const job = await createDubbing({
      audioDataUrl: body.audioDataUrl,
      fileName: body.fileName,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage
    });

    return response(200, {
      jobId: job.dubbing_id,
      expectedDurationSec: job.expected_duration_sec || 30
    });
  } catch (error) {
    console.error("Alsakb translation error:", error);
    return response(error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500, {
      message: error.message || "حدث خطأ في خادم الترجمة."
    });
  }
};