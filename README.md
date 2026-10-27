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

## Run with Docker Compose

1. Install and start Docker Desktop.
2. From the project root, create a local environment file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Edit `.env` and replace the example MongoDB password and JWT secret with strong values. Keep the MongoDB password alphanumeric because Compose uses it in the connection URI. Google OAuth variables are optional unless Google login is being configured.
4. Build and start the frontend, API, and MongoDB:

   ```powershell
   docker compose up --build -d
   ```

5. Check container status and test the frontend and API:

   ```powershell
   docker compose ps
   Invoke-WebRequest http://localhost:8080
   Invoke-RestMethod http://localhost:5000/api/health
   ```

   Open `http://localhost:8080` in a browser. The frontend proxies `/api` and `/uploads` requests to the backend. The backend connects to the Compose MongoDB service; data and uploaded files are stored in named volumes.
6. Stop the containers when finished:

   ```powershell
   docker compose down
   ```

   To also delete the database and uploaded files, use `docker compose down --volumes`.

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