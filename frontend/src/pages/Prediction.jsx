import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowDown, ArrowRight, Check, CloudSun, FileImage, Leaf, LoaderCircle, MapPin, ScanLine, ShieldCheck, UploadCloud, Volume2, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { diseaseAPI, predictAPI } from "../services/api";

const localeMap = {
  en: "en-US",
  kn: "kn-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  bn: "bn-IN",
};

const getResultValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
};

const diseaseTranslationKeys = [
  ["early blight", "earlyBlight"],
  ["late blight", "lateBlight"],
  ["leaf mold", "leafMold"],
  ["healthy", "healthy"],
  ["bacterial spot", "bacterialSpot"],
  ["septoria leaf spot", "septoriaLeafSpot"],
  ["spider mites", "spiderMites"],
  ["target spot", "targetSpot"],
  ["yellow leaf curl", "yellowLeafCurl"],
  ["mosaic virus", "mosaicVirus"],
];

const diseaseExplanationKeys = {
  "early blight": "earlyBlightDescription",
  "late blight": "lateBlightDescription",
  "leaf mold": "leafMoldDescription",
};

const localizedText = (text, language, translate) => {
  if (!text || language === "en") return text;
  const translations = {
    "Early blight is caused by the fungus Alternaria solani. It produces dark, concentric lesions on older leaves and can lead to early defoliation.": "earlyBlightDescription",
    "Late blight is a destructive disease caused by Phytophthora infestans. It spreads rapidly in cool, wet weather and can affect leaves, stems, and fruit.": "lateBlightDescription",
    "Tomato leaf mold is caused by Passalora fulva and thrives in warm, humid greenhouse conditions.": "leafMoldDescription",
    "Remove and destroy infected leaves.": "removeInfectedLeaves",
    "Avoid overhead irrigation and improve airflow.": "avoidOverheadWatering",
    "Rotate crops and remove plant debris after harvest.": "rotateAndClearDebris",
    "Use resistant varieties when available.": "useResistantVarieties",
    "Apply fungicide according to local recommendations.": "followFungicideAdvice",
  };
  const key = translations[text];
  return key ? translate(key) : text;
};

const inspectImageColors = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas is unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let green = 0;
      let yellowBrown = 0;
      let dark = 0;
      let brightness = 0;
      const pixelCount = pixels.length / 4;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const greenChannel = pixels[index + 1];
        const blue = pixels[index + 2];
        brightness += (red + greenChannel + blue) / 3;
        if (greenChannel > 45 && greenChannel > red * 1.08 && greenChannel > blue * 1.03) green += 1;
        if (red > 75 && greenChannel > 45 && red > greenChannel * 1.04 && greenChannel > blue * 1.05) yellowBrown += 1;
        if (red < 65 && greenChannel < 65 && blue < 65) dark += 1;
      }

      resolve({
        greenPercent: Math.round((green / pixelCount) * 100),
        yellowBrownPercent: Math.round((yellowBrown / pixelCount) * 100),
        darkPercent: Math.round((dark / pixelCount) * 100),
        brightness: Math.round(brightness / pixelCount),
      });
    } catch (error) {
      reject(error);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("Unable to read selected image"));
  };
  image.src = objectUrl;
});

const buildRecommendationText = (result, translate) => {
  const diseaseName = getResultValue(result, "disease_name", "disease", "predicted_class", "name") || "Tomato disease";
  const diseaseKey = diseaseTranslationKeys.find(([name]) => diseaseName.toLowerCase().includes(name))?.[1];
  const localizedName = diseaseKey ? translate(diseaseKey) : diseaseName;
  const adviceKeys = diseaseKey === "earlyBlight"
    ? ["removeInfectedLeaves", "avoidOverheadWatering"]
    : diseaseKey === "lateBlight" || diseaseKey === "leafMold"
      ? ["removeInfectedLeaves", "followFungicideAdvice"]
      : diseaseKey === "healthy"
        ? []
        : ["audioGeneralAdvice"];
  const advice = adviceKeys.map(translate).join(". ");
  const prefix = result.demo ? translate("audioProfilePrefix") : translate("audioFindingPrefix");
  return `${prefix} ${localizedName}.${advice ? ` ${advice}` : ""}`;
};

const Prediction = () => {
  const { t, language, mode } = useLanguage();
  const ui = (key) => t(`ui.${key}`);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelUnavailable, setModelUnavailable] = useState(false);
  const [visualObservations, setVisualObservations] = useState(null);
  const [diseaseProfiles, setDiseaseProfiles] = useState([]);
  const [loadingReference, setLoadingReference] = useState(false);
  const [referenceError, setReferenceError] = useState("");
  const [location, setLocation] = useState("Bengaluru");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const speakRecommendation = () => {
    if (!result || !("speechSynthesis" in window)) {
      setError(ui("serverError"));
      return;
    }

    const speechText = buildRecommendationText(result, ui);
    const utterance = new SpeechSynthesisUtterance(speechText);

    const speechLocale = localeMap[language] || "en-US";
    utterance.lang = speechLocale;
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(speechLocale.slice(0, 2))) || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const selectImage = (file) => {

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(ui("invalidImageError"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(ui("invalidImageError"));
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
    setModelUnavailable(false);
    setVisualObservations(null);
    setDiseaseProfiles([]);
    setLoadingReference(false);
    setReferenceError("");
  };

  const handleImageChange = (event) => selectImage(event.target.files?.[0]);
  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    selectImage(event.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setModelUnavailable(false);
    setVisualObservations(null);
    setDiseaseProfiles([]);
    setLoadingReference(false);
    setReferenceError("");
    setError("");
  };

  const handlePrediction = async () => {
    if (!image) {
      setError(ui("noImageError"));
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setModelUnavailable(false);
    setVisualObservations(null);
    setDiseaseProfiles([]);
    setLoadingReference(false);
    setReferenceError("");

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("location", location);
      formData.append("language", language);

      const response = await predictAPI.predict(formData);
      const payload = response.data?.data ?? response.data;
      setResult(payload);
    } catch (err) {
      if (!err.response) {
        setError(ui("unableConnectAiServer"));
      } else if (err.response.data?.code === "AI_MODEL_UNAVAILABLE" || err.response.status === 503) {
        setError(ui("modelServiceUnavailable"));
        setModelUnavailable(true);
        setLoadingReference(true);
        setReferenceError("");
        const [observations, catalogue] = await Promise.allSettled([
          inspectImageColors(image),
          diseaseAPI.list().then(async (response) => {
            const entries = response.data?.diseases || [];
            return Promise.all(entries.map(async (entry) => {
              const detail = await diseaseAPI.detail(entry.class_name);
              return detail.data?.disease;
            }));
          }),
        ]);
        if (observations.status === "fulfilled") setVisualObservations(observations.value);
        if (catalogue.status === "fulfilled") setDiseaseProfiles(catalogue.value.filter(Boolean));
        setLoadingReference(false);
        const referenceErrors = [];
        if (observations.status === "rejected") referenceErrors.push(ui("imageObservationFailed"));
        if (catalogue.status === "rejected" || !catalogue.value.length) referenceErrors.push(ui("diseaseGuideUnavailable"));
        setReferenceError(referenceErrors.join(" · "));
      } else if (err.response.data?.code === "IMAGE_PROCESSING_FAILED") {
        setError(ui("imageProcessFailed"));
      } else if (err.response.data?.code === "IMAGE_QUALITY_FAILED") {
        setError(err.response.data?.message || ui("imageProcessFailed"));
      } else {
        setError(err.response.data?.message || ui("predictionFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const diseaseName = getResultValue(result, "localized_disease_name", "disease_name", "prediction", "predicted_class") || "Unknown";
  const confidence = getResultValue(result, "confidence", "confidence_score");
  const management = getResultValue(result?.disease_info, "management") || [];
  const prevention = getResultValue(result?.disease_info, "prevention") || [];
  const diseaseDescription = getResultValue(result?.disease_info, "description");
  const diseaseNameForExplanation = getResultValue(result, "disease_name", "disease", "predicted_class") || "";
  const explanationKey = Object.entries(diseaseExplanationKeys).find(([name]) =>
    diseaseNameForExplanation.toLowerCase().replaceAll("_", " ").includes(name),
  )?.[1];
  const explanation = explanationKey ? ui(explanationKey) : diseaseDescription;
  const symptoms = getResultValue(result?.disease_info, "symptoms") || [];
  const risk = result?.future_risk || {};
  const weather = result?.weather || {};

  return (
    <div className="detection-page">
      <div className="detection-wrap">
        <header className="detection-heading">
          <span className="section-kicker"><ScanLine size={15} /> {ui("badge")}</span>
          <h1>{ui("detectDisease")}</h1>
          <p>{ui("uploadDescription")}</p>
          <div className="detection-trust"><span><ShieldCheck size={15} /> {ui("privateImage")}</span><span><Check size={15} /> ResNet50 + Grad-CAM</span></div>
        </header>

        {!preview && (
          <label
            htmlFor="leaf-image"
            className={`detection-dropzone ${dragActive ? "is-dragging" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false); }}
            onDrop={handleDrop}
          >
            <span className="dropzone-icon"><UploadCloud size={31} /></span>
            <span className="dropzone-title">{ui("uploadDrop")}</span>
            <span className="dropzone-description">{ui("uploadChooseHelp")}</span>
            <span className="button-primary dropzone-button">{ui("chooseImage")} <ArrowDown size={16} /></span>
            <span className="dropzone-formats">{ui("imageFormats")}</span>
            <input id="leaf-image" type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleImageChange} />
          </label>
        )}

        {preview && (
          <section className="detection-preview-card">
            <div className="preview-toolbar">
              <div><span className="section-kicker"><FileImage size={15} /> {ui("imageReady")}</span><h2>{ui("reviewPhoto")}</h2></div>
              <button className="icon-button light-icon-button" onClick={removeImage} disabled={loading} aria-label="Remove selected image"><X size={18} /></button>
            </div>
            <div className="preview-content">
              <div className="preview-image-wrap"><img src={preview} alt="Selected tomato leaf for AI analysis" /></div>
              <div className="preview-details">
                <div className="selected-file"><span className="file-image-icon"><FileImage size={19} /></span><span><strong>{image?.name}</strong><small>{(image.size / (1024 * 1024)).toFixed(2)} MB · Image selected</small></span></div>
                <label className="location-field"><span>{ui("growingLocation")}</span><span className="location-input"><MapPin size={17} /><input aria-label={ui("growingLocation")} value={location} onChange={(event) => setLocation(event.target.value)} placeholder={ui("enterCity")} /></span></label>
                <p className="privacy-note"><ShieldCheck size={15} /> {ui("privateImageUse")}</p>
                <button className="button-primary analyze-button" onClick={handlePrediction} disabled={loading}>
                  {loading ? <><LoaderCircle className="loading-spin" size={18} /> {ui("analyzing")}</> : <><ScanLine size={18} /> {ui("analyzeLeaf")} <ArrowRight size={17} /></>}
                </button>
                <label className="replace-image-link" htmlFor="replace-leaf-image">{ui("differentImage")}</label>
                <input id="replace-leaf-image" type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleImageChange} />
              </div>
            </div>
          </section>
        )}

        {error && <div className="detection-error" role="alert"><AlertCircle size={18} /><div><span>{error}</span>{modelUnavailable && <p>{ui("modelServiceDetail")}</p>}</div></div>}
        {modelUnavailable && image && <section className="analysis-result photo-observation-result" aria-label={ui("photoReviewTitle")}>
          <div className="detection-error" role="note"><AlertCircle size={18} /><div><strong>{ui("photoReviewDemoBadge")}</strong><p>{ui("photoReviewDisclaimer")}</p></div></div>
          {loadingReference && <div className="analysis-loading"><LoaderCircle className="loading-spin" size={20} /><strong>{ui("photoReviewLoading")}</strong></div>}
          {referenceError && <div className="detection-error" role="status"><AlertCircle size={18} /><span>{referenceError}</span></div>}
          {visualObservations && <article className="result-info-card guidance-card">
            <div className="result-info-title"><span className="result-info-icon guidance-result-icon"><ScanLine size={18} /></span><span><small>{ui("photoObservationsBadge")}</small><h3>{ui("photoReviewTitle")}</h3></span></div>
            <p>{ui("photoReviewMethod")}</p>
            <ul className="photo-observation-list">
              <li>{visualObservations.greenPercent >= 25 ? ui("observationGreenVisible") : ui("observationGreenLimited")}</li>
              {visualObservations.yellowBrownPercent >= 6 && <li>{ui("observationYellowPixels")}</li>}
              {visualObservations.darkPercent >= 4 && <li>{ui("observationDarkPixels")}</li>}
              {visualObservations.brightness < 65 && <li>{ui("observationImageDark")}</li>}
              {visualObservations.brightness > 235 && <li>{ui("observationImageBright")}</li>}
              {visualObservations.yellowBrownPercent < 6 && visualObservations.darkPercent < 4 && visualObservations.brightness >= 65 && visualObservations.brightness <= 235 && <li>{ui("observationNoStrongColorFlags")}</li>}
            </ul>
            <div className="photo-observation-metrics">
              <span>{ui("greenPixels")}: <strong>{visualObservations.greenPercent}%</strong></span>
              <span>{ui("yellowBrownPixels")}: <strong>{visualObservations.yellowBrownPercent}%</strong></span>
              <span>{ui("darkPixels")}: <strong>{visualObservations.darkPercent}%</strong></span>
            </div>
          </article>}
          <article className="result-info-card guidance-card">
            <div className="result-info-title"><span className="result-info-icon guidance-result-icon"><Leaf size={18} /></span><span><small>{ui("recommendedSteps")}</small><h3>{ui("generalCropCareTitle")}</h3></span></div>
            <p>{ui("generalCropCareDisclaimer")}</p>
            <ul>{["generalCareWater", "generalCareAirflow", "generalCareSanitation", "generalCareExpert"].map((key) => <li key={key}>{ui(key)}</li>)}</ul>
          </article>
          {diseaseProfiles.length > 0 && <article className="result-info-card disease-reference-guide">
            <div className="result-info-title"><span className="result-info-icon risk-result-icon"><Leaf size={18} /></span><span><small>{ui("diseaseLibraryKicker")}</small><h3>{ui("diseaseReferenceTitle")}</h3></span></div>
            <p>{ui("diseaseReferenceDisclaimer")}</p>
            <div className="disease-reference-list">{diseaseProfiles.map((disease) => {
              const nameKey = diseaseTranslationKeys.find(([name]) => (disease.name || "").toLowerCase().includes(name))?.[1];
              return <details className="disease-reference-entry" key={disease.name}>
                <summary><span>{disease.icon} {nameKey ? ui(nameKey) : disease.name}</span><small>{disease.type}</small></summary>
                <p>{localizedText(disease.description, language, ui)}</p>
                {disease.symptoms?.length > 0 && <><h4>{ui("symptoms")}</h4><ul>{disease.symptoms.map((symptom) => <li key={symptom}>{localizedText(symptom, language, ui)}</li>)}</ul></>}
                {disease.management?.length > 0 && <><h4>{ui("management")}</h4><ul>{disease.management.map((step) => <li key={step}>{localizedText(step, language, ui)}</li>)}</ul></>}
                {disease.prevention?.length > 0 && <><h4>{ui("prevention")}</h4><ul>{disease.prevention.map((step) => <li key={step}>{localizedText(step, language, ui)}</li>)}</ul></>}
              </details>;
            })}</div>
          </article>}
        </section>}

        {loading && <div className="analysis-loading">        <div className="analysis-loading-icon"><ScanLine size={23} /></div><strong>{ui("analyzing")}</strong><span>{ui("analysisLoadingDescription")}</span><div className="loading-track"><i /></div></div>}

        {result && (
          <section className="analysis-result">
            <div className="result-header">
              <div><span className="section-kicker"><Check size={15} /> {ui("analysisComplete")}</span><h2>{ui("resultTitle")}</h2></div>
              <button type="button" className="listen-button" onClick={speakRecommendation}><Volume2 size={17} /> {ui("listenRecommendation")}</button>
            </div>
            <div className="result-summary">
              <div className="result-disease-mark"><Leaf size={25} /></div>
              <div className="result-disease-copy"><span>{ui("detectedDisease")}</span><h3>{diseaseName}</h3><small><span className="online-dot" /> {ui("aiLabel")}</small></div>
              {confidence !== undefined && <div className="result-confidence"><strong>{Number(confidence).toFixed(2)}<small>%</small></strong><span>{ui("confidence")}</span></div>}
            </div>
            {(explanation || symptoms.length > 0) && <article className="result-info-card guidance-card">
              <div className="result-info-title"><span className="result-info-icon guidance-result-icon"><Leaf size={18} /></span><span><small>{ui("diseaseProfile")}</small><h3>{ui("diseaseExplanation")}</h3></span></div>
              {explanation && <p>{explanation}</p>}
              {symptoms.length > 0 && <><h4>{ui("symptoms")}</h4><ul>{symptoms.slice(0, 4).map((symptom, index) => <li key={`${symptom}-${index}`}>{symptom}</li>)}</ul></>}
            </article>}
            {result.gradcam?.overlay_b64 && <div className="gradcam-result"><img src={`data:image/png;base64,${result.gradcam.overlay_b64}`} alt={ui("gradcamAlt")} /><p>{ui("gradcamExplainability")}</p></div>}
            {result.gradcam_error && <p className="result-disclaimer">{ui("gradcamUnavailable")}</p>}
            <div className="result-information">
              {risk.risk_level && <article className="result-info-card risk-info-card">
                <div className="result-info-title"><span className="result-info-icon risk-result-icon"><CloudSun size={18} /></span><span><small>{ui("environmentalOutlook")}</small><h3>{ui("futureRisk")}</h3></span><strong className="risk-level">{risk.risk_level}</strong></div>
                <div className="risk-progress"><span style={{ width: `${Math.max(0, Math.min(100, Number(risk.risk_score) || 0))}%`, background: risk.color || undefined }} /></div>
                <p>{risk.explanation}</p>
                {risk.risk_factors?.length > 0 && <ul>{risk.risk_factors.map((factor) => <li key={factor}>{factor}</li>)}</ul>}
                {mode === "research" && <small className="research-metadata">Score: {risk.risk_score}/100 · Rainy forecast periods: {risk.rainy_days}</small>}
              </article>}
              {weather.temperature !== undefined && <article className="result-info-card">
                <div className="result-info-title"><span className="result-info-icon weather-result-icon"><CloudSun size={18} /></span><span><small>{ui("localConditions")} {weather.city ? `· ${weather.city}` : ""}</small><h3>{ui("weatherContext")}</h3></span></div>
                <div className="weather-metrics"><span><strong>{weather.temperature}°</strong><small>{ui("temperature")}</small></span><span><strong>{weather.humidity}%</strong><small>{ui("humidity")}</small></span><span><strong>{weather.precipitation_probability ?? 0}%</strong><small>{ui("rainProbability")}</small></span></div>
                {mode === "research" && <p>Wind: {weather.wind_speed} m/s · Consecutive rainy days: {weather.consecutive_rainy_days}</p>}
                {mode === "research" && weather.forecast?.length > 0 && <div className="forecast-list">{weather.forecast.slice(0, 5).map((day) => <div key={day.period}><span>{day.period}</span><span>{day.temperature}°C</span><span>{day.precipitation_probability}% rain</span></div>)}</div>}
              </article>}
              {management.length > 0 && <article className="result-info-card guidance-card"><div className="result-info-title"><span className="result-info-icon guidance-result-icon"><Check size={18} /></span><span><small>{ui("recommendedSteps")}</small><h3>{ui("management")}</h3></span></div><ul>{management.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></article>}
              {prevention.length > 0 && <article className="result-info-card guidance-card"><div className="result-info-title"><span className="result-info-icon guidance-result-icon"><ShieldCheck size={18} /></span><span><small>{ui("ongoingCare")}</small><h3>{ui("prevention")}</h3></span></div><ul>{prevention.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></article>}
            </div>
            <p className="result-disclaimer"><ShieldCheck size={15} /> {result.message || ui("analysisDisclaimer")}</p>
          </section>
        )}
        <p className="detection-disclaimer">{ui("detectionDisclaimer")}</p>
      </div>
    </div>
  );
};

export default Prediction;