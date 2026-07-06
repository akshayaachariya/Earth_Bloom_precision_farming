
# 🌱 Earth Bloom - Smart Precision Agriculture Platform

## 📌 Description

Earth Bloom is a modern web-based precision agriculture platform designed to empower farmers with intelligent, data-driven decision-making tools. The system focuses on improving crop productivity, optimizing resource usage, and supporting sustainable farming practices.

The platform analyzes key agricultural parameters such as soil type, weather conditions, and seasonal factors to provide accurate crop recommendations and yield insights. It also assists in efficient irrigation planning, helping farmers reduce water wastage and improve overall farm management.

Built using a scalable and user-friendly architecture, Earth Bloom integrates a responsive frontend with cloud-based backend services. Firebase is used for authentication and real-time database management, ensuring secure access and efficient data handling. The application is designed to be simple, accessible, and adaptable for real-world agricultural use.

## 🚀 Key Features

- 🌾 Smart Crop Recommendation System
- 📊 Yield Prediction & Analysis
- 💧 Intelligent Irrigation Planning
- 🔐 Secure User Authentication
- ☁️ Real-time Cloud Database (Firestore)
- 📱 Fully Responsive User Interface
- ⚡ Fast Performance with Vite

## 🛠️ Technologies Used

### 💻 Frontend

- React.js
- Vite
- TypeScript
- Tailwind CSS
- HTML5
- CSS3

### ☁️ Backend / Cloud Services

- Firebase Authentication
- Firebase Firestore Database
- Firebase Hosting (optional deployment)

### 🔗 APIs & Libraries

- Axios
- React Router DOM

### 🧰 Development Tools

- Git
- GitHub
- VS Code
- npm

## 📂 Project Structure

```text
earth-bloom/
├── src/
│   ├── components/
│   ├── pages/
│   ├── firebase.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── vite.config.ts
```

## ⚙️ Installation & Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/akshayaachariya/Earth_Bloom_precision_farming-.git
cd Earth_Bloom_precision_farming-
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Run the Application

```bash
npm run dev
```

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project

- Go to Firebase Console
- Create a new project
- Register a web app

### Step 2: Enable Services

- Enable Authentication (Email/Password)
- Enable Firestore Database (Test Mode for development)

### Step 3: Add API Configuration

- OPENWEATHERMAP API KEY
- GOOGLE MAPS API KEY
- 

### Step 4: Add Firebase Config

Create `src/firebase.ts`:

```ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
```



## 📊 Database Structure (Firestore)

Example collections:

- `users/`
- `cropRecommendations/`
- `yieldPredictions/`
- `irrigationPlans/`

Each document stores:

- Farmer details
- Soil type
- Crop suggestions
- Prediction results

<img width="1858" height="906" alt="weather" src="https://github.com/user-attachments/assets/993c5e22-8d99-428d-9325-bc64db8ee861" />
<img width="1882" height="911" alt="soilAnalysis" src="https://github.com/user-attachments/assets/e0c80639-9d71-42a6-b506-56bab4800b2c" />
<img width="1882" height="906" alt="recommendation" src="https://github.com/user-attachments/assets/717e063e-1280-480f-891a-c4429be86e06" />
<img width="1900" height="912" alt="homepage" src="https://github.com/user-attachments/assets/c589661a-5418-47e5-a043-3533ae40a74a" />
<img width="1890" height="902" alt="ContactUs" src="https://github.com/user-attachments/assets/321ccd80-3b33-4328-8194-207c3cd90c7d" />
<img width="1875" height="903" alt="AccountSetting" src="https://github.com/user-attachments/assets/1b658cba-bbb5-424c-926f-eb3330d2bdf7" />

## 🌍 Future Scope

- 🤖 AI/ML-based crop prediction models
- 🌦️ Weather API integration
- 📷 Plant disease detection (image-based)
- 📊 Advanced analytics dashboard
- 📱 Mobile application (React Native)

## 🤝 Contribution Guidelines

Contributions are welcome.

1. Fork the repository
2. Create a new branch
3. Make changes
4. Submit a Pull Request
