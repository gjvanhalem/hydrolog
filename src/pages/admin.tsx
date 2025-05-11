import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../app/layout';
import { Status } from '../types';

const AdminPage: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/statuses')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch statuses');
        }
        return response.json();
      })
      .then((data: Status[]) => setStatuses(data))
      .catch((error) => console.error('Error fetching statuses:', error));
  }, []);

  const addStatus = useCallback(() => {
    if (!newStatus.trim()) {
      console.warn('Cannot add an empty status');
      return;
    }
    fetch('http://localhost:5000/api/statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newStatus }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to add status');
        }
        return response.json();
      })
      .then((data: Status) => {
        setStatuses((prevStatuses) => [...prevStatuses, data]);
        setNewStatus('');
      })
      .catch((error) => console.error('Error adding status:', error));
  }, [newStatus]);

  const deleteStatus = useCallback((id: number) => {
    fetch(`http://localhost:5000/api/statuses/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete status');
        }
        setStatuses((prevStatuses) => prevStatuses.filter((status) => status.id !== id));
      })
      .catch((error) => console.error('Error deleting status:', error));
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Status Change - Field: ${name}, Value: ${value}`);
    setStatuses((prev) => {
      const updatedStatuses = prev.map((status) =>
        status.id === parseInt(name) ? { ...status, name: value } : status
      );
      console.log('Updated statuses:', updatedStatuses);
      return updatedStatuses;
    });
  }, []);

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Admin - Manage Statuses</h1>
        <div className="mt-4">
          <input
            type="text"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="Add new status"
            className="border p-2 rounded"
          />
          <button onClick={addStatus} className="ml-2 bg-blue-500 text-white p-2 rounded">Add</button>
        </div>
        <ul className="mt-4">
          {statuses.map((status) => (
            <li key={status.id} className="flex justify-between items-center border-b p-2">
              <input
                type="text"
                value={status.name}
                onChange={(e) => handleStatusChange(e)}
                name={status.id.toString()}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => deleteStatus(status.id)} className="text-red-500">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default AdminPage;
