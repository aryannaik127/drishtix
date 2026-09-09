# DRISHTIX – Intelligent Border Surveillance Platform

This is the Smart India Hackathon (SIH) prototype demonstrating the core concept of converting existing CCTV feeds into an intelligent event-driven pipeline.

## Features Included in MVP
- 4-Camera Live View Simulation
- Dark Command-Center Aesthetic (React + Tailwind)
- FastAPI Backend API
- Intelligent Event generation engine (Simulating YOLO Object Detection, Virtual Fence Intrusion, and ANPR)
- Real-time Alert system and Analytics Charts

## Quick Start Guide

### 1. Start the Backend
The backend runs the FastAPI server and the simulated Computer Vision engine.
```bash
cd backend
.\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start the Frontend
The frontend provides the main command dashboard.
```bash
cd frontend
npm install
npm run dev
```

### 3. Run the Demo
1. Open your browser to `http://localhost:5173`.
2. You will see the DRISHTIX dashboard.
3. Click **START DEMO** in the top right corner.
4. Watch the camera grids populate with simulated AI detections (bounding boxes, alerts).
5. Wait ~8 seconds to see the **Virtual Fence Intrusion (CRITICAL)** alert appear.

## Project Structure
- `frontend/`: React + Vite frontend application.
- `backend/`: FastAPI backend with SQLite.
- `backend/cv_engine.py`: The simulated Demo Engine. In a real environment, this file would be replaced with actual OpenCV/YOLO inference loops consuming RTSP feeds.
