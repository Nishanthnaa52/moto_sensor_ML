import pandas as pd
import pickle
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, ConfusionMatrixDisplay, roc_curve, auc
import matplotlib.pyplot as plt

# Load test data
input_csv = 'ai4i_dc_motor_cleaned.csv'
df = pd.read_csv(input_csv)

FEATURE_COLUMNS = [
    'Process temperature [K]',
    'Rotational speed [rpm]',
    'Torque [Nm]',
    'Tool wear [min]'
]
TARGET_COLUMN = 'Machine failure'

X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMN]

# Load model
with open('dc_motor_fault_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Predict
preds = model.predict(X)

# Metrics
acc = accuracy_score(y, preds)
cm = confusion_matrix(y, preds)
report = classification_report(y, preds, digits=4)

print(f"Accuracy: {acc:.4f}\n")
print("Classification Report:\n", report)

# Plot confusion matrix
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=model.classes_)
disp.plot(cmap=plt.cm.Blues)
plt.title('Confusion Matrix')
plt.show()

# Predict probabilities for ROC curve
if hasattr(model, "predict_proba"):
    y_proba = model.predict_proba(X)[:, 1]
else:
    # Fallback for models without predict_proba
    y_proba = preds

fpr, tpr, thresholds = roc_curve(y, y_proba)
roc_auc = auc(fpr, tpr)

print(f"True Positives: {(cm[1,1])}")
print(f"False Positives: {(cm[0,1])}")
print(f"True Negatives: {(cm[0,0])}")
print(f"False Negatives: {(cm[1,0])}")

# Plot ROC curve
plt.figure()
plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC)')
plt.legend(loc="lower right")
plt.show()
