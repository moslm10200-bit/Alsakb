const audioInput = document.getElementById("audio-file");
const dropzone = document.getElementById("dropzone");
const selectedFileBox = document.getElementById("selected-file");
const sourceName = document.getElementById("source-name");
const sourceMeta = document.getElementById("source-meta");
const sourcePlayer = document.getElementById("source-player");
const removeSourceButton = document.getElementById("remove-source");
const sourceLanguage = document.getElementById("source-language");
const targetLanguage = document.getElementById("target-language");
const translateButton = document.getElementById("translate-button");
const outputPlaceholder = document.getElementById("output-placeholder");
const outputResult = document.getElementById("output-result");
const outputPlayer = document.getElementById("output-player");
const resultLanguage = document.getElementById("result-language");
const addToCartButton = document.getElementById("add-to-cart");
const progressArea = document.getElementById("progress-area");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const cartDialog = document.getElementById("cart-dialog");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartFooter = document.getElementById("cart-footer");
const cartCount = document.getElementById("cart-count");
const whatsappLink = document.getElementById("whatsapp-link");
const monthlyPlan = document.getElementById("monthly-plan");
const annualPlan = document.getElementById("annual-plan");
const quotaRemainingLabel = document.getElementById("quota-remaining");
const quotaRingProgress = document.getElementById("quota-ring-progress");
const toast = document.getElementById("toast");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

const TOTAL_FREE_TRANSLATIONS = 7;
const FREE_QUOTA_KEY = "alsakb-free-quota-remaining";
const languages = {
  ar: "العربية",
  en: "الإنجليزية",
  tr: "التركية",
  fr: "الفرنسية",
  de: "الألمانية",
  es: "الإسبانية",
  it: "الإيطالية",
  ru: "الروسية",
  zh: "الصينية",
  ja: "اليابانية",
  ko: "الكورية",
  hi: "الهندية",
  ur: "الأوردية",
  fa: "الفارسية",
  he: "العبرية",
  el: "اليونانية",
  nl: "الهولندية",
  sv: "السويدية",
  no: "النرويجية",
  da: "الدنماركية",
  fi: "الفنلندية",
  pl: "البولندية",
  cs: "التشيكية",
  sk: "السلوفاكية",
  uk: "الأوكرانية",
  ro: "الرومانية",
  bg: "البلغارية",
  hu: "المجرية",
  sr: "الصربية",
  hr: "الكرواتية",
  bs: "البوسنية",
  pt: "البرتغالية",
  id: "الإندونيسية",
  ms: "الملايوية",
  th: "التايلاندية",
  vi: "الفيتنامية",
  sw: "السواحيلية",
  am: "الأمهرية",
  bn: "البنغالية",
  ta: "التاميلية",
  te: "التيلوغوية",
  mr: "الماراثية",
  pa: "البنجابية",
  gu: "الغوجاراتية",
  ml: "المالايالامية",
  kn: "الكانادا",
  ne: "النيبالية",
  si: "السنهالية",
  fil: "الفلبينية",
  ca: "الكتالونية",
  eu: "الباسكية",
  gl: "الجاليكية",
  sq: "الألبانية",
  mk: "المقدونية",
  et: "الإستونية",
  lv: "اللاتفية",
  lt: "الليتوانية",
  is: "الأيسلندية",
  ga: "الأيرلندية",
  cy: "الويلزية",
  mt: "المالطية",
  az: "الأذربيجانية",
  kk: "الكازاخية",
  uz: "الأوزبكية",
  hy: "الأرمنية",
  ka: "الجورجية",
  ps: "البشتوية",
  ku: "الكردية",
  so: "الصومالية",
  yo: "اليوروبا",
  ha: "الهوسا",
  zu: "الزولو",
  af: "الأفريقانية",
  sn: "الشونا",
  ig: "الإيغبو",
  my: "البورمية",
  km: "الخميرية",
  lo: "اللاوية",
  mn: "المنغولية"
};

const WHATSAPP_NUMBER = "963992147669";
const DATABASE_NAME = "alsakb-preview-cart";
const STORE_NAME = "audio-items";

let selectedFile = null;
let sourceObjectUrl = null;
let outputObjectUrl = null;
let outputBlob = null;
let outputIsFree = false;
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let toastTimer = null;
let cartAudioUrls = [];

function populateLanguageMenus() {
  const sortedLanguages = Object.entries(languages).sort((a, b) => a[1].localeCompare(b[1], "ar"));
  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent = "اكتشاف تلقائي";
  sourceLanguage.append(autoOption);

  const targetPlaceholder = document.createElement("option");
  targetPlaceholder.value = "";
  targetPlaceholder.textContent = "اختر اللغة";
  targetPlaceholder.disabled = true;
  targetPlaceholder.selected = true;
  targetLanguage.append(targetPlaceholder);

  sortedLanguages.forEach(([code, name]) => {
    const sourceOption = document.createElement("option");
    sourceOption.value = code;
    sourceOption.textContent = name;
    sourceLanguage.append(sourceOption);

    const targetOption = document.createElement("option");
    targetOption.value = code;
    targetOption.textContent = name;
    targetLanguage.append(targetOption);
  });
}

function getFreeQuota() {
  const stored = Number.parseInt(localStorage.getItem(FREE_QUOTA_KEY) || "", 10);
  return Number.isFinite(stored) ? Math.min(TOTAL_FREE_TRANSLATIONS, Math.max(0, stored)) : TOTAL_FREE_TRANSLATIONS;
}

function saveFreeQuota(value) {
  localStorage.setItem(FREE_QUOTA_KEY, String(value));
  updateQuotaMeter(value);
}

function updateQuotaMeter(value = getFreeQuota()) {
  quotaRemainingLabel.textContent = String(value);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - value / TOTAL_FREE_TRANSLATIONS);
  quotaRingProgress.style.strokeDasharray = String(circumference);
  quotaRingProgress.style.strokeDashoffset = String(offset);
  document.querySelector(".quota-meter").setAttribute(
    "aria-label",
    `${value} من ${TOTAL_FREE_TRANSLATIONS} محاولات مجانية متبقية`
  );
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
}

function setProgressIdle(message = "جاهز لتحويل صوتك") {
  progressTrack.classList.remove("is-indeterminate");
  progressFill.style.width = "0%";
  progressLabel.textContent = message;
  progressPercent.textContent = "—";
  progressTrack.setAttribute("aria-valuenow", "0");
}

function setProgressRunning() {
  progressTrack.classList.add("is-indeterminate");
  progressLabel.textContent = "يرفع التسجيل إلى محرك الترجمة…";
  progressPercent.textContent = "جارٍ";
  progressTrack.removeAttribute("aria-valuenow");
}

function setProgressDone() {
  progressTrack.classList.remove("is-indeterminate");
  progressFill.style.width = "100%";
  progressLabel.textContent = "اكتمل التحويل";
  progressPercent.textContent = "100%";
  progressTrack.setAttribute("aria-valuenow", "100");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

function updateTranslateButton() {
  translateButton.disabled = !(selectedFile && targetLanguage.value);
}

function resetOutput() {
  if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
  outputObjectUrl = null;
  outputBlob = null;
  outputIsFree = false;
  outputPlayer.removeAttribute("src");
  outputPlayer.load();
  outputResult.hidden = true;
  outputPlaceholder.hidden = false;
  addToCartButton.disabled = true;
  setProgressIdle();
}

function setSourceFile(file) {
  if (!file) return;
  if (!file.type.startsWith("audio/")) {
    showToast("اختر ملفًا صوتيًا بصيغة مدعومة.");
    return;
  }
  if (file.size > 100 * 1024 * 1024) {
    showToast("حجم الملف أكبر من 100 ميغابايت.");
    return;
  }

  if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
  selectedFile = file;
  sourceObjectUrl = URL.createObjectURL(file);
  sourceName.textContent = file.name;
  sourceMeta.textContent = formatBytes(file.size);
  sourcePlayer.src = sourceObjectUrl;
  sourcePlayer.hidden = false;
  selectedFileBox.hidden = false;
  dropzone.hidden = true;
  resetOutput();
  updateTranslateButton();
}

function clearSourceFile() {
  selectedFile = null;
  audioInput.value = "";
  selectedFileBox.hidden = true;
  sourcePlayer.hidden = true;
  sourcePlayer.removeAttribute("src");
  sourcePlayer.load();
  dropzone.hidden = false;
  if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
  sourceObjectUrl = null;
  resetOutput();
  updateTranslateButton();
}

audioInput.addEventListener("change", () => setSourceFile(audioInput.files?.[0]));
removeSourceButton.addEventListener("click", clearSourceFile);
targetLanguage.addEventListener("change", () => {
  resetOutput();
  updateTranslateButton();
});
sourceLanguage.addEventListener("change", () => {
  resetOutput();
  updateTranslateButton();
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
});

dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  setSourceFile(file);
});

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("تعذّر قراءة التسجيل."));
    reader.readAsDataURL(blob);
  });
}

async function postTranslationRequest(payload) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const details = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(details.message || "تعذّر الاتصال بخادم الترجمة.");
  }
  return details;
}

async function fetchTranslationStatus(jobId) {
  const response = await fetch(`/api/translate?action=status&jobId=${encodeURIComponent(jobId)}`, {
    method: "POST"
  });
  const details = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(details.message || "تعذّر معرفة حالة التحويل.");
  }
  return details;
}

async function fetchTranslatedAudio(jobId, language) {
  const response = await fetch(
    `/api/translate?action=audio&jobId=${encodeURIComponent(jobId)}&language=${encodeURIComponent(language)}`,
    { method: "POST" }
  );
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || "تعذّر تنزيل الصوت المترجم من الخادم.");
  }
  return response.blob();
}

async function waitForTranslation(jobId, durationSeconds) {
  const maxWaitMs = Math.max(120000, Math.min(480000, (durationSeconds || 30) * 4500));
  const startedAt = Date.now();

  while (Date.now() - startedAt < maxWaitMs) {
    const status = await fetchTranslationStatus(jobId);
    const normalizedStatus = String(status.status || "").toLowerCase();

    if (["dubbed", "completed", "complete", "success", "finished"].includes(normalizedStatus)) {
      return status;
    }
    if (["failed", "error", "failure"].includes(normalizedStatus)) {
      throw new Error(status.error || "فشل محرك الترجمة في معالجة الصوت.");
    }

    const elapsed = Date.now() - startedAt;
    const estimated = Math.min(92, 12 + Math.round((elapsed / maxWaitMs) * 78));
    progressFill.style.width = `${estimated}%`;
    progressPercent.textContent = `${estimated}%`;
    progressLabel.textContent = "يترجم الصوت ويحافظ على نبرة المتحدث…";
    await new Promise((resolve) => window.setTimeout(resolve, 1800));
  }

  throw new Error("استغرق التحويل وقتًا أطول من المتوقع. افتح السلة أو أعد المحاولة بعد قليل.");
}

translateButton.addEventListener("click", async () => {
  if (!selectedFile || !targetLanguage.value) {
    showToast("اختر ملفًا صوتيًا ولغة الترجمة أولًا.");
    return;
  }

  translateButton.disabled = true;
  setProgressRunning();

  try {
    const audioDataUrl = await blobToDataUrl(selectedFile);
    const created = await postTranslationRequest({
      action: "create",
      audioDataUrl,
      fileName: selectedFile.name,
      sourceLanguage: sourceLanguage.value || "auto",
      targetLanguage: targetLanguage.value
    });

    const status = await waitForTranslation(created.jobId, created.expectedDurationSec);
    outputBlob = await fetchTranslatedAudio(created.jobId, targetLanguage.value);
    if (!outputBlob.type.startsWith("audio/")) {
      throw new Error("لم يرجع محرك التحويل ملفًا صوتيًا صالحًا.");
    }

    if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
    outputObjectUrl = URL.createObjectURL(outputBlob);
    outputPlayer.src = outputObjectUrl;
    resultLanguage.textContent = `باللغة ${languages[targetLanguage.value] || targetLanguage.value}`;
    const remainingQuota = getFreeQuota();
    outputIsFree = remainingQuota > 0;
    if (outputIsFree) saveFreeQuota(remainingQuota - 1);
    outputPlaceholder.hidden = true;
    outputResult.hidden = false;
    outputResult.classList.remove("is-arriving");
    void outputResult.offsetWidth;
    outputResult.classList.add("is-arriving");
    window.setTimeout(() => outputResult.classList.remove("is-arriving"), 3900);
    document.querySelector(".preview-note").textContent = outputIsFree
      ? "ضمن محاولاتك المجانية: أضف المقطع إلى السلة لتنزيله بصيغة MP3."
      : "انتهت المحاولات المجانية: أضف المقطع إلى السلة لإتمام الطلب عبر واتساب.";
    addToCartButton.disabled = false;
    setProgressDone();
    showToast("اكتمل تجهيز المقطع.");
  } catch (error) {
    setProgressIdle("تعذّر إكمال التحويل");
    showToast(error.message || "تعذّر الاتصال بمحرك التحويل.");
  } finally {
    updateTranslateButton();
  }
});

const recordButton = document.getElementById("record-button");
const recordStatus = document.getElementById("record-status");
const moonRecordLabel = recordButton.querySelector(".moon-record-label");
const moonRecordHint = recordButton.querySelector(".moon-record-hint");

function animateMoonPress() {
  recordButton.classList.remove("is-popping", "is-flashing");
  void recordButton.offsetWidth;
  recordButton.classList.add("is-popping", "is-flashing");
  window.setTimeout(() => recordButton.classList.remove("is-popping", "is-flashing"), 760);
}

function stopActiveRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast("التسجيل يحتاج متصفحًا يدعم الميكروفون واتصالًا آمنًا HTTPS.");
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "";
    mediaRecorder = new MediaRecorder(mediaStream, preferredType ? { mimeType: preferredType } : undefined);

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) recordedChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const mimeType = mediaRecorder?.mimeType || recordedChunks[0]?.type || "audio/webm";
      const extension = mimeType.includes("mp4") ? "m4a" : "webm";
      const recording = new File(
        recordedChunks,
        `alsakb-recording-${Date.now()}.${extension}`,
        { type: mimeType }
      );

      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      mediaRecorder = null;
      recordedChunks = [];
      recordButton.classList.remove("is-recording");
      recordButton.setAttribute("aria-pressed", "false");
      moonRecordLabel.textContent = "تحدّث الآن";
      moonRecordHint.textContent = "اضغط القمر لبدء التسجيل";
      recordStatus.textContent = "تم حفظ التسجيل المؤقت في هذه الصفحة.";
      if (recording.size) {
        setSourceFile(recording);
        if (targetLanguage.value) {
          window.setTimeout(() => translateButton.click(), 150);
        }
      }
    });

    mediaRecorder.start();
    recordButton.classList.add("is-recording");
    recordButton.setAttribute("aria-pressed", "true");
    moonRecordLabel.textContent = "إيقاف التسجيل";
    moonRecordHint.textContent = "اضغط القمر لحفظ التسجيل";
    recordStatus.textContent = "التسجيل جارٍ… اضغط القمر مجددًا للإيقاف.";
  } catch {
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    recordStatus.textContent = "لم يتم السماح باستخدام الميكروفون.";
    showToast("اسمح للموقع باستخدام الميكروفون، ثم جرّب مرة أخرى.");
  }
}

recordButton.addEventListener("click", () => {
  animateMoonPress();
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    stopActiveRecording();
  } else {
    startRecording();
  }
});

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("المتصفح لا يدعم حفظ سلة الصوت."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCartItem(item) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(item);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function getCartItems() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      database.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function deleteCartItem(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function createCartItemElement(item) {
  const article = document.createElement("article");
  article.className = "cart-item";

  const heading = document.createElement("div");
  heading.className = "cart-item-heading";

  const badge = document.createElement("span");
  badge.className = "file-badge";
  badge.textContent = "♫";
  badge.setAttribute("aria-hidden", "true");

  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = item.fileName || "مقطع مترجم";
  const language = document.createElement("span");
  language.textContent = `اللغة: ${languages[item.language] || item.language}`;
  copy.append(title, language);

  const remove = document.createElement("button");
  remove.className = "text-button";
  remove.type = "button";
  remove.textContent = "إزالة";
  remove.setAttribute("aria-label", `إزالة ${item.fileName || "المقطع"} من السلة`);
  remove.addEventListener("click", async () => {
    try {
      await deleteCartItem(item.id);
      await renderCart();
      showToast("أزيل المقطع من السلة.");
    } catch {
      showToast("تعذّر تحديث السلة.");
    }
  });

  heading.append(badge, copy, remove);

  const player = document.createElement("audio");
  player.controls = true;
  player.preload = "metadata";
  player.controlsList = "nodownload noplaybackrate";
  player.disablePictureInPicture = true;
  const audioUrl = URL.createObjectURL(item.audio);
  cartAudioUrls.push(audioUrl);
  player.src = audioUrl;

  const accessArea = document.createElement("div");
  accessArea.className = "cart-item-access";

  if (item.isFree) {
    const download = document.createElement("a");
    download.className = "free-download";
    download.href = audioUrl;
    download.download = "alsakb-translated.mp3";
    download.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14"/></svg><span>تحميل MP3 مجانًا</span>';
    accessArea.append(download);
  } else {
    const paidNote = document.createElement("div");
    paidNote.className = "item-paid-note";
    paidNote.textContent = "مقطع مدفوع — أكمل الطلب عبر واتساب أدناه.";
    accessArea.append(paidNote);
  }

  article.append(heading, player, accessArea);
  return article;
}

function makeWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function renderCart() {
  cartAudioUrls.forEach((url) => URL.revokeObjectURL(url));
  cartAudioUrls = [];

  try {
    const items = await getCartItems();
    const paidItems = items.filter((item) => !item.isFree);
    cartCount.textContent = String(items.length);
    cartItems.replaceChildren(...items.map(createCartItemElement));
    cartEmpty.hidden = items.length > 0;
    cartFooter.hidden = paidItems.length === 0;

    if (paidItems.length) {
      const summary = paidItems
        .map((item, index) => `${index + 1}) ${item.fileName} — ${languages[item.language] || item.language}`)
        .join("\n");
      const message = `مرحبًا، انتهت محاولاتي المجانية وأرغب بإتمام طلب المقاطع التالية من السكب:\n${summary}\nيرجى تزويدي بطريقة الدفع والتفعيل.`;
      whatsappLink.href = makeWhatsAppUrl(message);
      monthlyPlan.href = makeWhatsAppUrl(
        `مرحبًا، أرغب بالاشتراك الشهري في السكب بقيمة 25 دولارًا شهريًا.\nالمقاطع المطلوبة:\n${summary}`
      );
      annualPlan.href = makeWhatsAppUrl(
        `مرحبًا، أرغب بالاشتراك السنوي في السكب بقيمة 299 دولارًا سنويًا.\nالمقاطع المطلوبة:\n${summary}`
      );
    }
  } catch {
    cartCount.textContent = "0";
    cartItems.replaceChildren();
    cartEmpty.hidden = false;
    cartFooter.hidden = true;
    showToast("تعذّر فتح سلة الصوت في هذا المتصفح.");
  }
}

addToCartButton.addEventListener("click", async () => {
  if (!outputBlob) return;

  try {
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    await saveCartItem({
      id,
      fileName: selectedFile?.name || "مقطع مترجم",
      language: targetLanguage.value,
      isFree: outputIsFree,
      audio: outputBlob,
      createdAt: new Date().toISOString()
    });
    await renderCart();
    cartDialog.showModal();
  } catch {
    showToast("تعذّر حفظ المقطع في سلة هذا الجهاز.");
  }
});

document.getElementById("open-cart").addEventListener("click", async () => {
  await renderCart();
  cartDialog.showModal();
});

document.getElementById("close-cart").addEventListener("click", () => cartDialog.close());
cartDialog.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeLabel.textContent = isDark ? "الوضع الفاتح" : "الوضع الداكن";
  localStorage.setItem("alsakb-theme", theme);
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

setTheme(localStorage.getItem("alsakb-theme") || "light");
populateLanguageMenus();
updateQuotaMeter();
renderCart();
setProgressIdle();