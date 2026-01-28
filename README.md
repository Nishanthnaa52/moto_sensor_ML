# Motor Sensor Machine learing Model

### This document you know about this project and how to handle.

A simple motor-sensor ML demo: a trained Random Forest model detects DC motor failures from four sensor features and a React dashboard visualizes live sensor values. The repository ships utilities that currently generate random sensor data; this README explains how to run everything locally and how to connect a real-time hardware source (ESP32 or Arduino Uno + host computer) so you can run the system with real sensor readings.

Summary
- Train a Random Forest model from the provided cleaned dataset (ai4i_dc_motor_cleaned.csv).
- A Flask endpoint returns simulated (random) sensor readings.
- A prediction endpoint loads the trained model and returns failure predictions.
- A React + Vite dashboard polls the sensor endpoint and displays time series.
- Continuous test script to exercise end-to-end flow.
- Instructions and helper code to integrate an ESP32 (HTTP POST) or Arduino UNO (serial) for real-time data.

Repository structure (important files)
- random_input_api.py — Flask app that provides GET /random_input and /random_predict (simulated).
- train_dc_motor_model.py — trains RandomForest and writes `dc_motor_fault_model.pkl`.
- dc_motor_fault_model.pkl — (expected after running the train script).
- continuous_test.py — sample client that fetches /random_input and posts to a prediction endpoint.
- MotorDashboard/ — React + Vite dashboard (front-end) that polls /random_input and visualizes the 4 sensors.
  - MotorDashboard/src/App.jsx — dashboard logic
  - MotorDashboard/README.md — default Vite template notes

Features (sensor columns)
- `Process temperature [K]`
- `Rotational speed [rpm]`
- `Torque [Nm]`
- `Tool wear [min]`

Quickstart — prerequisites
- Python 3.8+
- Node 16+ (for the dashboard)
- pip packages: Flask, flask-cors, pandas, numpy, scikit-learn, requests, pyserial (if using serial), or install from a requirements file if you add one.

Install Python deps (example)
```
python -m pip install flask flask-cors pandas numpy scikit-learn requests pyserial
```

1) Train the model (optional if you already have dc_motor_fault_model.pkl)
```
python train_dc_motor_model.py
```
This reads `ai4i_dc_motor_cleaned.csv`, trains a RandomForest, and writes `dc_motor_fault_model.pkl`.

2) Run the simulated/random sensor API
```
python random_input_api.py
```
- By default it runs on port 5001 and serves:
  - GET /random_input — returns a random sample JSON of the 4 sensor features
  - GET /random_predict — (provided) loads `dc_motor_fault_model.pkl` and returns a small batch of simulated predictions

3) Prediction API
- The repo expects a prediction service to receive sensor JSON and return a prediction at `/predict` (continuous_test.py posts to `http://127.0.0.1:5002/predict` by default). If you don't have a prediction service, run the small `predict_api.py` helper shown below (it runs on port 5002).

4) Run the dashboard
```
cd MotorDashboard
npm install
npm run dev
```
- The dashboard polls `http://127.0.0.1:5001/random_input` once per second by default.
- To point the dashboard to real hardware, change the fetch URL inside `MotorDashboard/src/App.jsx` or run a hardware forwarder to the same endpoint.

5) Continuous testing
- Start both the random_input API (port 5001) or your hardware sender and a prediction server (port 5002).
- Then:
```
python continuous_test.py
```

Real-time hardware integration
You can replace the simulated random source with real sensor readings. Two suggested approaches:

A) ESP32 (recommended if you have WiFi-capable hardware)
- ESP32 sends readings via HTTP POST to the prediction API (e.g. `http://<PC_IP>:5002/predict`) or to a collector endpoint which then forwards to prediction.
- Example uses analog sensors or simulators mapped to the same ranges used in random generator:
  - Process temperature: 305–315 K
  - Rotational speed: 1200–2000 rpm
  - Torque: 20–60 Nm
  - Tool wear: 0–250 min

An example ESP32 sketch is provided (see file `esp32_sender.ino` below). Modify `WIFI_SSID`, `WIFI_PASS`, and `SERVER_HOST`/`SERVER_PORT`.

B) Arduino UNO (no WiFi) — use USB serial + host forwarder
- Connect UNO to a host PC via USB, use a simple sketch that prints comma-separated sensor values or JSON to serial.
- Run `serial_forwarder.py` on the host to read serial lines and POST them to the prediction endpoint.
- This approach is useful if you already have serial-based sensors or if you have a PC sitting next to the Arduino.

Security & network notes
- These examples use unencrypted HTTP on local networks. For production or over-the-internet setups, use HTTPS and authentication (API keys, tokens).
- Make sure your firewall allows the ports you choose (5001, 5002, etc.).
- If your PC IP changes frequently, configure a static local IP or use mDNS/resolving.

Files I recommend adding (examples)
- `predict_api.py` — simple Flask server that loads `dc_motor_fault_model.pkl` and exposes POST /predict.
- `esp32_sender.ino` — sample ESP32 Arduino sketch to read analog inputs, map them, and POST JSON.
- `serial_forwarder.py` — Python script that reads JSON or CSV from serial and forwards to the prediction API.

Troubleshooting
- Dashboard shows `--` values: ensure `random_input_api.py` is running and accessible on the URL configured in `App.jsx`.
- `continuous_test.py` errors about failing POST requests: check the PREDICT_URL variable and ensure the prediction server is running.
- Model file not found: run `train_dc_motor_model.py` to create `dc_motor_fault_model.pkl`.

License & contributions
- Add license, dataset attribution, and contribution guidelines as needed.

That's the core README to get you started. Below are the helper files I mentioned — drop them into your repo (or adapt them) and run the steps above.

