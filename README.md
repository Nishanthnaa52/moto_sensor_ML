# Motor Sensor Machine Learning Model

### Project Overview
A simple motor-sensor ML demo: a trained Random Forest model detects DC motor failures from four sensor features and a React dashboard visualizes live sensor values. The repository ships utilities that currently generate random sensor data; this README explains how to run everything locally and how to connect a real-time hardware source (ESP32 or Arduino Uno + host computer) so you can run the system with real sensor readings.

## Features
- Train a Random Forest model from the provided cleaned dataset (`ai4i_dc_motor_cleaned.csv`).
- Flask backend streams real sensor readings from CSV using WebSocket (SocketIO) for real-time updates.
- Prediction endpoint loads the trained model and returns failure predictions.
- React + Vite dashboard displays live sensor values, charts, and predictions.
- Dashboard allows start/stop of streaming and auto-stops on fault (prediction=1).
- Visually prominent critical warning notification appears when system stops due to a fault.
- Continuous test script to exercise end-to-end flow.
- Instructions and helper code to integrate an ESP32 (HTTP POST) or Arduino UNO (serial) for real-time data.

## Repository Structure
- `random_input_api.py` — Flask app for simulated/random sensor readings (legacy, use SocketIO backend for real-time).
- `model_api.py` — Flask app with SocketIO streaming real sensor data from CSV and predictions.
- `train_dc_motor_model.py` — trains RandomForest and writes `dc_motor_fault_model.pkl`.
- `dc_motor_fault_model.pkl` — (expected after running the train script).
- `continuous_test.py` — sample client that fetches sensor data and posts to prediction endpoint.
- `MotorDashboard/` — React + Vite dashboard (front-end) for real-time visualization.
  - `MotorDashboard/src/App.jsx` — dashboard logic
  - `MotorDashboard/src/App.css` — dashboard styles

## Sensor Columns
- `Process temperature [K]`
- `Rotational speed [rpm]`
- `Torque [Nm]`
- `Tool wear [min]`

## Quickstart
### Prerequisites
- Python 3.8+
- Node 16+ (for the dashboard)
- pip packages: Flask, flask-cors, flask-socketio, pandas, numpy, scikit-learn, requests, pyserial (or install from `requirements.txt`)

Install Python dependencies:
```
pip install -r requirements.txt
```

### 1) Train the model (optional if you already have dc_motor_fault_model.pkl)
```
python train_dc_motor_model.py
```
This reads `ai4i_dc_motor_cleaned.csv`, trains a RandomForest, and writes `dc_motor_fault_model.pkl`.

### 2) Run the real-time sensor streaming backend (SocketIO)
```
python model_api.py
```
- Runs on port 5001 and streams real sensor values and predictions via WebSocket (SocketIO).
- Auto-stops streaming and emits a fault when prediction=1.

### 3) Prediction API
- The repo expects a prediction service to receive sensor JSON and return a prediction at `/predict` (continuous_test.py posts to `http://127.0.0.1:5002/predict` by default).
- If you don't have a prediction service, run the small `predict_api.py` helper (runs on port 5002).

### 4) Run the dashboard
```
cd MotorDashboard
npm install
npm run dev
```
- The dashboard connects to the backend via WebSocket (SocketIO) for real-time updates.
- Displays live sensor values, charts, predictions, and a critical warning notification if a fault is detected.
- Allows start/stop of streaming; auto-stops and disables updates on fault.

### 5) Continuous testing
- Start both the sensor streaming backend (port 5001) and a prediction server (port 5002).
- Then:
```
python continuous_test.py
```

## Real-time Hardware Integration
You can replace the simulated random source with real sensor readings. Two suggested approaches:

### A) ESP32 (WiFi hardware)
- ESP32 sends readings via HTTP POST to the prediction API (e.g. `http://<PC_IP>:5002/predict`) or to a collector endpoint which then forwards to prediction.
- Example uses analog sensors or simulators mapped to the same ranges used in random generator:
  - Process temperature: 305–315 K
  - Rotational speed: 1200–2000 rpm
  - Torque: 20–60 Nm
  - Tool wear: 0–250 min

### B) Arduino UNO (USB serial + host forwarder)
- Connect UNO to a host PC via USB, use a simple sketch that prints comma-separated sensor values or JSON to serial.
- Run `serial_forwarder.py` on the host to read serial lines and POST them to the prediction API.

## Security & Network Notes
- These examples use unencrypted HTTP on local networks. For production or over-the-internet setups, use HTTPS and authentication (API keys, tokens).
- Make sure your firewall allows the ports you choose (5001, 5002, etc.).
- If your PC IP changes frequently, configure a static local IP or use mDNS/resolving.

## Troubleshooting
- Dashboard shows `--` values: ensure the backend (model_api.py) is running and accessible on the URL configured in `App.jsx`.
- `continuous_test.py` errors about failing POST requests: check the PREDICT_URL variable and ensure the prediction server is running.
- Model file not found: run `train_dc_motor_model.py` to create `dc_motor_fault_model.pkl`.
- Critical warning notification: If the dashboard stops and shows a red warning, a fault was detected and the system was auto-stopped for safety.

## Frontend Preview

Below is a screenshot of the Motor Sensor Dashboard frontend application. It displays live sensor values, charts, predictions, and a critical warning notification when a fault is detected.

![Motor Sensor Dashboard Screenshot](MotorDashboard/public/dashboard_screenshot.png)

## License & Contributions
- Add license, dataset attribution, and contribution guidelines as needed.

---

This README is updated for the real-time WebSocket backend, dashboard critical warning, and hardware integration. For legacy random input API, see previous instructions or use the new streaming backend for best results.

