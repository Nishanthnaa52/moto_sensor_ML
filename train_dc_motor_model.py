import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
import numpy as np
import pickle

# Load the cleaned dataset
input_csv = 'ai4i_dc_motor_cleaned.csv'
df = pd.read_csv(input_csv)

# Features and target
FEATURE_COLUMNS = [
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]
TARGET_COLUMN = 'Machine failure'

X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMN]

# Split the data (optional, for validation)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest Classifier
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Save only the Random Forest model for API use
with open('dc_motor_fault_model.pkl', 'wb') as f:
    pickle.dump(rf_model, f)

print('Random Forest model trained and saved as dc_motor_fault_model.pkl')
