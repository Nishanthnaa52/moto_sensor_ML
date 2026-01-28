import numpy as np
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
# Define the feature columns as per your dataset (excluding Product ID and UDI)
FEATURE_COLUMNS = [
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]

def generate_random_input():
    # Generate random values within reasonable ranges for each feature
    return {
        'Process temperature [K]': float(np.random.uniform(305, 315)),
        'Rotational speed [rpm]': int(np.random.uniform(1200, 2000)),
        'Torque [Nm]': float(np.random.uniform(20, 60)),
        'Tool wear [min]': int(np.random.uniform(0, 250))
    }

@app.route('/random_input', methods=['GET'])
def random_input_api():
    """API to generate a random test input sample."""
    sample = generate_random_input()
    return jsonify(sample)

@app.route('/random_predict', methods=['GET'])
def random_predict_api():
    """API to continuously generate random input and return predictions (simulated real-time)."""
    import pickle
    # Load the trained model
    with open('dc_motor_fault_model.pkl', 'rb') as f:
        model = pickle.load(f)
    results = []
    for _ in range(10):  # Simulate 10 continuous predictions
        sample = generate_random_input()
        X = pd.DataFrame([sample], columns=FEATURE_COLUMNS)
        prediction = model.predict(X)[0]
        results.append({'input': sample, 'prediction': int(prediction)})
    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5001, debug=True)
