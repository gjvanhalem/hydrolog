import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Log History | HydroLog',
  description: 'Redirecting to combined Reports & History page'
};

export default function DailyLogPage() {
  return (
    <>
      {/* Meta refresh is a reliable way to redirect */}
      <meta httpEquiv="refresh" content="0;url=/reports?tab=log-history" />
      
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Redirecting...</h1>
        <p className="dark:text-gray-300">
          You are being redirected to the reports page. 
          If you are not redirected automatically, <a href="/reports?tab=log-history" className="text-blue-500 hover:underline">click here</a>.
        </p>
      </div>
    </>
  );
}