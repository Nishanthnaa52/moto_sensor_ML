import requests
import time

RANDOM_INPUT_URL = 'http://127.0.0.1:5001/random_input'
PREDICT_URL = 'http://127.0.0.1:5002/predict'
count = int(input("Enter test count :"))
print('Starting continuous test:')
for i in range(count):  # Number of test cycles
    # Get random input
    response = requests.get(RANDOM_INPUT_URL)
    sample = response.json()
    # Send to prediction API
    pred_response = requests.post(PREDICT_URL, json=sample)
    prediction = pred_response.json()['prediction']
    print(f"Test {i+1}: Input: {sample} => Prediction: {prediction}")
    time.sleep(3)  # Wait 1 second between tests
