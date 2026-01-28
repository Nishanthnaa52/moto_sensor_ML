import { useEffect, useRef, useState } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
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
  const intervalRef = useRef();

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const res = await fetch('http://127.0.0.1:5001/random_input');
      const data = await res.json();
      setLatest(data);
      setSensorHistory(prev => {
        const updated = { ...prev };
        SENSOR_KEYS.forEach(key => {
          updated[key] = [...(prev[key] || []), data[key]].slice(-30); // keep last 30
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="dashboard-container">
      <h1>Motor Sensor Dashboard</h1>
      <div className="sensor-row">
        {SENSOR_KEYS.map(sensor => (
          <div className="sensor-value-box" key={sensor}>
            <div className="sensor-label">{sensor}</div>
            <div className="sensor-value" style={{color: getValueColor(sensor, latest[sensor]), fontWeight: 'bold', fontSize: '2em'}}>
              {latest[sensor] !== undefined ? latest[sensor].toFixed(2) : '--'}
            </div>
          </div>
        ))}
      </div>
      <div className="charts-row large-charts-row">
        {SENSOR_KEYS.map(sensor => (
          <div className="sensor-chart large-sensor-chart" key={sensor}>
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
