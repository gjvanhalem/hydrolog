import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../app/globals.css';
import { PlantLog, SystemLog } from '../types';
import Layout from '../app/layout';

const HistoryPage: React.FC = () => {
  const [plantLogs, setPlantLogs] = useState<PlantLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    // Fetch plant logs
    fetch('http://localhost:5000/api/plant-logs')
      .then((response) => response.json())
      .then((data) => setPlantLogs(data));

    // Fetch system logs
    fetch('http://localhost:5000/api/system-logs')
      .then((response) => response.json())
      .then((data) => setSystemLogs(data));
  }, []);

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="mt-4">View the history of plant and system logs below:</p>
        <div className="mt-4">
          {/* Add your history content here */}
        </div>
      </div>
    </Layout>
  );
};

export default HistoryPage;
