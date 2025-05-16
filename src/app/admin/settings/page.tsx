import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HydroLog - System Settings',
  description: 'Configure HydroLog system settings',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>
      
      <div className="mb-6">
        <a 
          href="/admin" 
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Admin Dashboard
        </a>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Database Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-medium mb-2">PostgreSQL Connection</h3>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>Connected</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-medium mb-2">Automatic Backups</h3>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>Not Configured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
        <form>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Application Name</label>
                <input 
                  type="text" 
                  value="HydroLog" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Session Timeout (minutes)</label>
                <input 
                  type="number" 
                  value="60" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  readOnly
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Log Level</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white">
                <option>DEBUG</option>
                <option selected>INFO</option>
                <option>WARN</option>
                <option>ERROR</option>
              </select>
            </div>
            
            <div className="flex items-center mt-4">
              <input 
                type="checkbox" 
                id="darkMode" 
                className="mr-2" 
                checked 
              />
              <label htmlFor="darkMode">Enable Dark Mode Support</label>
            </div>
            
            <div className="flex items-center mt-4">
              <input 
                type="checkbox" 
                id="analyticsMode" 
                className="mr-2" 
              />
              <label htmlFor="analyticsMode">Enable Anonymous Usage Analytics</label>
            </div>
            
            <div className="mt-6">
              <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2">
                Save Settings
              </button>
              <button type="button" className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded">
                Reset to Defaults
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-700 dark:text-yellow-300">
              <strong>Warning:</strong> The following actions can result in data loss. Please proceed with caution.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Export All Data
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
              Import Data
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
              Clean Temporary Files
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Reset Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
