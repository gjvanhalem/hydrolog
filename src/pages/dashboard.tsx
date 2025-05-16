import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../app/globals.css';
import { Plant, SystemLog } from '../types';

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const plants: Plant[] = [
    {
      id: '1',
      name: 'Tomato',
      position: 'A1',
      status: 'growth',
      photoUrl: '/tomato.jpg', // Corrected path
      logs: [],
    },
    {
      id: '2',
      name: 'Lettuce',
      position: 'B2',
      status: 'germination',
      photoUrl: '/lettuce.jpg', // Corrected path
      logs: [],
    },
  ];

  const systemLogs: SystemLog[] = [
    {
      date: '2025-05-08',
      waterRefill: true,
      pH: 6.5,
      EC: 1.2,
      TDS: 800,
      temperature: 22,
      notes: 'System running smoothly.',
    },
  ];
  return (
    <div className="container mx-auto">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-4">Welcome to the dashboard. Here is an overview of your plants and system logs.</p>
        <div className="mt-4">
          {/* Add your dashboard content here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
