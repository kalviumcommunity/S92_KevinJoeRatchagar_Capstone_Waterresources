# Smart Water Management System

## 📌 Project Overview

The **Smart Water Management System** is a web application designed to help farmers and water authorities efficiently monitor, allocate, and manage water resources. The system provides real-time reservoir information, water allocation schedules, usage analytics, and water request management to promote sustainable water distribution.

## 🎯 Problem Statement

Many farmers face difficulties in accessing water efficiently due to the lack of proper monitoring and allocation systems. This project aims to provide a digital platform that enables transparent water management, helping users make informed decisions while conserving water resources.

## ✨ Features

- User Login and Authentication
- Dashboard with Reservoir Water Level
- Water Allocation Schedule
- Water Monitoring Dashboard
- Water Usage Analytics
- Soil Moisture Monitoring
- Water Request Form

- Notifications and Alerts
- User Profile Management
- Responsive User Interface

## 🛠️ Technologies Used

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB

## Run locally

1. Create `server/.env` with a valid MongoDB connection string:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
PORT=5000
```

2. Start the API:

```bash
cd server
npm install
npm start
```

3. Start the React client in another terminal:

```bash
cd client
npm install
npm run dev
```

The client reads and writes water resources through `GET` and `POST` at `/api/water-resources`. It also supports `DELETE /api/water-resources/:id`.

## AI description suggestions

The add-resource form has a **Suggest description** button. Enter a name, type, and location, and optionally describe the current condition. The suggestion appears in the editable description field; review or change it before saving. The condition is saved with the resource.

The API endpoint is `POST /api/ai/description`. If `LLM_API_KEY` is configured on the backend, it calls an OpenAI-compatible chat-completions endpoint. Set `LLM_API_URL` and `LLM_MODEL` on the server to use a different compatible provider or model. The API key is only read by the backend and must never be added to client variables such as `VITE_*`.

Without an LLM key, the endpoint returns a basic local template and `source: "local"`; the interface labels it as a local fallback. Successful LLM responses return `source: "llm"` and the interface identifies them as LLM-generated. Provider/network errors are shown to the user rather than being presented as AI-generated suggestions.

For local development, create the server environment file and edit it with your own MongoDB connection string and a private JWT secret:

```powershell
Copy-Item server\.env.example server\.env
```

Set `LLM_API_KEY` in `server/.env` to enable the real provider. Leave it empty to test the local fallback. Do not commit `server/.env`.

Run the backend tests with:

```powershell
cd server
npm install
npm test
```

### Tools
- Git
- GitHub
- VS Code
- Figma

## 📱 UI Screens

- Splash Screen
- Dashboard
- Water Allocation
- Water Monitoring
- Notifications
- Water Request
- User Profile

## 📅 Capstone Development Plan

### Day 1
- Create GitHub Repository
- Create README.md
- Create Pull Request

### Day 2
- Prepare User Flow
- Design Wireframes in Figma

### Day 3
- Initialize React Application
- Organize Project Structure

### Day 4
- Develop Login and Home Screens

### Day 5
- Build Dashboard UI

### Day 6
- Develop Water Allocation Module

### Day 7
- Develop Water Monitoring Module

### Day 8
- Create Water Request Module

### Day 9
- Develop Notifications and Profile Pages

### Day 10
- Build Backend using Node.js and Express.js

### Day 11
- Connect MongoDB Database

### Day 12
- Integrate Frontend with Backend APIs

### Day 13
- Testing and Bug Fixing

### Day 14
- Final Deployment and Documentation

## 🚀 Future Enhancements

- Real-time IoT sensor integration
- Weather Forecast API
- SMS and Email Notifications
- AI-based Water Usage Prediction
- Mobile Application Support

## 👨‍💻 Developer

**Kevin Joe Ratchagar**

Kalvium Capstone Project

Squad: **S92**