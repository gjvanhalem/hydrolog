'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface ChartWrapperProps {
  data: any;
  options: ChartOptions<'line'>;
  className?: string;
}

export default function ChartWrapper({ data, options, className }: ChartWrapperProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check if data is valid
  const hasValidData = React.useMemo(() => {
    try {
      // Make sure data exists and has proper structure
      return data && 
        data.datasets && 
        Array.isArray(data.datasets) && 
        data.datasets.length > 0 && 
        // Make sure we have labels if datasets exist
        data.labels && 
        Array.isArray(data.labels);
    } catch (err) {
      console.error('Error validating chart data:', err);
      setErrorMessage('Invalid chart data structure');
      return false;
    }
  }, [data]);
  
  // Log the data structure when it changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      console.log('Chart data structure:', {
        hasLabels: !!data.labels,
        labelCount: data.labels?.length,
        hasDatasets: !!data.datasets,
        datasetCount: data.datasets?.length,
      });
      
      if (data.datasets && data.datasets.length > 0) {
        console.log('First dataset:', {
          label: data.datasets[0].label,
          dataPoints: data.datasets[0].data?.length || 0,
        });
      }
    }
  }, [data]);
  
  // Use a click interceptor div around the chart
  return (
    <div 
      className={`chart-wrapper ${className || ''}`}
      style={{ position: 'relative', minHeight: '250px' }}
      onClick={(e) => {
        // Prevent event propagation to avoid click error
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {hasValidData ? (
        <React.Fragment>
          {/* Wrap Line in try-catch error boundary */}
          {(() => {
            try {
              return <Line data={data} options={options} />;
            } catch (err) {
              console.error('Error rendering chart:', err);
              return (
                <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400">
                  Error rendering chart. Please try again.
                </div>
              );
            }
          })()}
        </React.Fragment>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          {errorMessage || 'No data available for chart display'}
        </div>
      )}
    </div>
  );
}
