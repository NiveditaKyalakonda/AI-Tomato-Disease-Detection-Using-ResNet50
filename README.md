# 🍅 AI-Based Tomato Leaf Disease Detection and Smart Agricultural Decision Support System

> ResNet50 deep learning · Grad-CAM explainability · React + Flask full-stack

---

## Project Overview

This is a complete full-stack web application that allows farmers to upload tomato leaf images and receive instant AI-powered disease diagnoses, management recommendations, Grad-CAM heatmap explanations, weather-based risk alerts, and more.

---

## Features

| Feature | Status |
|---|---|
| Bundled trained ResNet50 model (real inference; no prediction fallback) | ✅ |
| Grad-CAM Explainable AI (XAI) | ✅ |
| Confidence score with warnings | ✅ |
| Disease severity estimation | ✅ |
| Disease information & management | ✅ |
| Image quality checker | ✅ |
| Prediction history | ✅ |
| Farmer dashboard with charts | ✅ |
| Weather-based disease risk | ✅ |
| Expert consultation request | ✅ |
| Kannada / Hindi disease names | ✅ |
| Admin panel | ✅ |
| JWT authentication | ✅ |
| MongoDB persistence | ✅ |

---

## Project Structure

```
tomato-ai/
├── backend/               Flask API server
│   ├── app.py             All endpoints
│   ├── config.py
│   ├── test_tensorflow.py Runtime diagnostic
│   ├── test_model.py      Real model inference diagnostic
│   ├── .env               Environment variables
│   ├── model/
│   │   ├── resnet50_tomato_disease.keras   (place trained model here)
│   │   └── class_names.json
│   ├── services/
│   │   ├── prediction.py
│   │   ├── preprocessing.py
│   │   ├── gradcam.py
│   │   └── weather.py
│   ├── database/
│   │   ├── database.py    MongoDB helpers
│   │   └── disease_data.py
│   ├── uploads/
│   └── results/
│
├── training/              Model training scripts
│   ├── train.py           Main training (ResNet50, 2-stage)
│   ├── predict.py         Command-line prediction test
│   ├── evaluate.py        Test set evaluation
│   ├── confusion_matrix.py
│   └── save_model.py      Copy best model → backend
│
├── frontend/              React + Vite SPA
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Prediction.jsx   (upload + results + Grad-CAM)
│       │   ├── History.jsx
│       │   ├── HistoryDetail.jsx
│       │   ├── Diseases.jsx
│       │   ├── DiseaseDetail.jsx
│       │   ├── WeatherRisk.jsx
│       │   ├── Profile.jsx
│       │   ├── Admin.jsx
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   └── Header.jsx
│       ├── services/api.js
│       └── context/AuthContext.jsx
│
└── dataset/
    ├── train/
    ├── validation/
    └── test/
```

---

## Detected Disease Classes

| Class | Disease | Type |
|---|---|---|
| Tomato_Bacterial_spot | Bacterial Spot | Bacterial |
| Tomato_Early_blight | Early Blight | Fungal |
| Tomato_Late_blight | Late Blight | Fungal (Oomycete) |
| Tomato_Leaf_Mold | Leaf Mold | Fungal |
| Tomato_Septoria_leaf_spot | Septoria Leaf Spot | Fungal |
| Tomato_Spider_mites_Two_spotted_spider_mite | Spider Mites | Pest |
| Tomato_Target_Spot | Target Spot | Fungal |
| Tomato_Tomato_Yellow_Leaf_Curl_Virus | Yellow Leaf Curl Virus | Viral |
| Tomato_Tomato_mosaic_virus | Mosaic Virus | Viral |
| Tomato_healthy | Healthy | — |

---

## Final Submission Notes

This project is prepared for final delivery with the required language flow: English, Kannada, and Hindi are the only active locales. The frontend reads the selected language from local storage and the recommendation panel can use browser speech synthesis to read the disease advice aloud in the chosen language.

### Production-friendly usage

1. Start the backend in the project root or backend folder.
2. Start the frontend with Vite on port 5173.
3. Open the app, choose the language, upload a tomato leaf image, and listen to the spoken recommendation.

## Quick Start

### 1. Verify the existing trained model

```bash
cd backend
python -m venv venv-tf
venv-tf\Scripts\python.exe -m pip install --upgrade pip
venv-tf\Scripts\python.exe -m pip install -r requirements.txt
venv-tf\Scripts\python.exe test_tensorflow.py
venv-tf\Scripts\python.exe test_model.py ..\dataset\test\augmented_dataset\Tomato_Early_blight\img_1.jpg
```

The backend loads the checked-in `backend/model/resnet50_tomato_disease.keras` and its
ordered `class_names.json`. The model was saved with Keras 3.12.4 and its training
pipeline applies ResNet50 preprocessing inside the model graph; uploaded images must
therefore be RGB, resized to 224×224, and passed as raw 0–255 pixel values. Keep this
class order and preprocessing unchanged.

Use the pinned TensorFlow CPU 2.21.0 runtime in `venv-tf`. The older TensorFlow CPU
2.16.2 wheel failed during `_pywrap_tf2` initialization on this Intel Celeron N4500,
which does not support AVX. TensorFlow CPU 2.21.0 was verified on this machine using
its available SSE3/SSE4.1/SSE4.2 instructions. The diagnostics load the bundled
trained model and run a real test image; no sample predictions are substituted.
`test_model.py` also verifies that a Grad-CAM heatmap and overlay are generated from
the loaded classifier's target-class gradients.

### 2. Start the backend

```bash
cd ..
.\start_backend.ps1
# → http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | / | Server and model status |
| GET | /api/health | TensorFlow/model health |
| GET | /api/model-info | Loaded model metadata |
| POST | /api/predict | Upload image & run trained model inference |
| GET | /api/history | Get user's scan history |
| GET | /api/history/:id | Get single scan detail |
| DELETE | /api/history/:id | Delete a scan |
| GET | /api/diseases | List all diseases |
| GET | /api/diseases/:name | Disease detail |
| GET | /api/weather-risk | Weather-based risk |
| POST | /api/expert-request | Request expert review |
| GET | /api/dashboard | Farmer dashboard data |
| GET | /api/admin/stats | Admin statistics |
| GET | /api/admin/users | All users |

---

## Environment Variables (backend/.env)

```
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
MONGO_URI=mongodb://localhost:27017/
DB_NAME=tomato_disease_db
WEATHER_API_KEY=your_openweathermap_api_key
MODEL_PATH=model/resnet50_tomato_disease.keras
```

> **MongoDB** is optional — the app runs in-memory fallback mode if MongoDB is not available.
> **Weather API key** is optional — sample data is used without it. Get a free key at [openweathermap.org](https://openweathermap.org/api).

---

## Technology Stack

| Layer | Technology |
|---|---|
| AI Model | TensorFlow / Keras, ResNet50 |
| Explainability | Grad-CAM |
| Backend | Python, Flask, Flask-JWT-Extended |
| Database | MongoDB (pymongo) |
| Image Processing | OpenCV, Pillow |
| Frontend | React 19, Vite |
| Charts | Recharts |
| Styling | Custom CSS (dark theme) |

---

## Limitations & Disclaimer

- AI predictions are not a guaranteed diagnosis. Always consult a local agricultural expert for serious disease outbreaks.
- Model accuracy depends on training data quality and diversity.
- Treatment recommendations are general management guidance, not professional prescriptions.
- Weather-based risk is an indicator only — weather alone cannot confirm a disease diagnosis.

---

*Built as an AI final-year project — Tomato Disease Detection Using ResNet50*
