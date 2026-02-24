import numpy as np
import pandas as pd
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import pickle
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

FEATURE_COLUMNS = [
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]

# Load the trained model
with open('dc_motor_fault_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Load the real dataset for streaming
train_df = pd.read_csv('ai4i_dc_motor_cleaned.csv')
# Use only the required columns for input
input_df = train_df[FEATURE_COLUMNS]
input_records = input_df.to_dict(orient='records')

@socketio.on('start_stream')
def handle_stream():
    for sample in input_records:
        X = pd.DataFrame([sample], columns=FEATURE_COLUMNS)
        prediction = model.predict(X)[0]
        emit('sensor_data', {'input': sample, 'prediction': int(prediction)})
        socketio.sleep(2)  # 2 second interval using socketio.sleep for non-blocking delay

if __name__ == '__main__':
    socketio.run(app, port=5001, debug=True)
