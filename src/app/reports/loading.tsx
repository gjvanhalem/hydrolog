export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        
        <div className="flex space-x-1 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
            <div className="h-60 w-full bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-start py-4">
                  <div>
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
