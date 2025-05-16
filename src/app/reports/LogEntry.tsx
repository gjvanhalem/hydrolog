'use client';

interface LogEntryProps {
  id: number;
  type: string;
  value: number;
  unit: string;
  note?: string | null;
  logDate: string;
  systemName?: string | null;
}

export default function LogEntry({ id, type, value, unit, note, logDate, systemName }: LogEntryProps) {
  const formattedDate = new Date(logDate).toLocaleTimeString();

  return (
    <div className="py-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium dark:text-gray-100">
            {type.replace('_', ' ').toUpperCase()}
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value: {value} {unit}
          </p>
          {systemName && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              System: {systemName}
            </p>
          )}
          {note && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{note}</p>
          )}
        </div>
        <time className="text-sm text-gray-600 dark:text-gray-400">
          {formattedDate}
        </time>
      </div>
    </div>
  );
}
