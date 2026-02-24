import { useEffect, useRef, useState } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import io from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SENSOR_KEYS = [
  'Process temperature [K]',
  'Rotational speed [rpm]',
  'Torque [Nm]',
  'Tool wear [min]'
];

const SENSOR_COLORS = {
  'Process temperature [K]': '#ff6384',
  'Rotational speed [rpm]': '#36a2eb',
  'Torque [Nm]': '#ffce56',
  'Tool wear [min]': '#4bc0c0'
};

const SENSOR_THRESHOLDS = {
  'Process temperature [K]': 312,
  'Rotational speed [rpm]': 1800,
  'Torque [Nm]': 55,
  'Tool wear [min]': 200
};

function getValueColor(sensor, value) {
  // Red if above threshold, else normal color
  return value > SENSOR_THRESHOLDS[sensor] ? '#e74c3c' : '#222';
}

export default function App() {
  const [sensorHistory, setSensorHistory] = useState({
    'Process temperature [K]': [],
    'Rotational speed [rpm]': [],
    'Torque [Nm]': [],
    'Tool wear [min]': []
  });
  const [latest, setLatest] = useState({});
  const [latestPrediction, setLatestPrediction] = useState(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://127.0.0.1:5001');
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (socketRef.current) socketRef.current.off('sensor_data');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('start_stream');
      socketRef.current.on('sensor_data', (data) => {
        setTimeout(() => {
          setLatest(data.input);
          setLatestPrediction(data.prediction);
          setSensorHistory(prev => {
            const updated = { ...prev };
            SENSOR_KEYS.forEach(key => {
              updated[key] = [...(prev[key] || []), data.input[key]].slice(-30);
            });
            return updated;
          });
          // Auto-stop if prediction is 1 (fault)
          if (data.prediction === 1) {
            setIsRunning(false);
            if (socketRef.current) socketRef.current.off('sensor_data');
          }
        }, 2000); // 1 second delay for each input
      });
    }
    return () => {
      if (socketRef.current) socketRef.current.off('sensor_data');
    };
  }, [isRunning]);

  const handleStop = () => {
    setIsRunning(false);
    if (socketRef.current) socketRef.current.off('sensor_data');
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  // Show critical warning if stopped due to fault
  const showCriticalWarning = latestPrediction === 1 && !isRunning;

  return (
    <div className="dashboard-container">
      <h1>Motor Sensor Dashboard</h1>
      {showCriticalWarning && (
        <div className="critical-warning">
          <span className="critical-icon">&#9888;</span>
          <span className="critical-text">CRITICAL FAULT DETECTED: System stopped due to fault condition!</span>
        </div>
      )}
      <div style={{marginBottom: '1.5rem'}}>
        <button onClick={isRunning ? handleStop : handleStart} style={{marginLeft: 24, padding: '0.5em 1.5em', fontSize: '1em', borderRadius: 8, border: 'none', background: isRunning ? '#e74c3c' : '#43a047', color: '#fff', fontWeight: 600, cursor: 'pointer'}}>
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>
      <div className="sensor-row">
        {SENSOR_KEYS.map(sensor => (
          <div className="sensor-value-box" key={sensor}>
            <div className="sensor-label">{sensor}</div>
            <div className="sensor-value" style={{color: getValueColor(sensor, latest[sensor]), fontWeight: 'bold', fontSize: '2em'}}>
              {latest[sensor] !== undefined ? latest[sensor].toFixed(2) : '--'}
            </div>
          </div>
        ))}
        {latestPrediction !== undefined && (
          <div className="sensor-value-box">
            <div className="sensor-label">Prediction</div>
            <div className="sensor-value" style={{color: latestPrediction === 1 ? '#e74c3c' : '#222', fontWeight: 'bold', fontSize: '2em'}}>
              {latestPrediction}
            </div>
          </div>
        )}
      </div>
      <div className="charts-row large-charts-row">
        {SENSOR_KEYS.map(sensor => (
          <div className="sensor-chart large-sensor-chart" key={sensor}>
            <div className="chart-info">
              <span className="chart-info-title">Sensor:</span> <span className="chart-info-sensor">{sensor}</span>
            </div>
            <div className="chart-title">{sensor} Over Time</div>
            <Line
              data={{
                labels: Array(sensorHistory[sensor].length).fill(''),
                datasets: [
                  {
                    label: sensor,
                    data: sensorHistory[sensor],
                    borderColor: SENSOR_COLORS[sensor],
                    backgroundColor: SENSOR_COLORS[sensor],
                    tension: 0.3,
                  }
                ]
              }}
              options={{
                animation: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: { color: '#eee' }
                  },
                  x: {
                    display: false
                  }
                }
              }}
              height={320}
              width={600}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
