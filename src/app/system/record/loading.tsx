export default function Loading() {
  return (    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
              <div className="h-10 w-full bg-gray-300 dark:bg-gray-600 rounded mt-6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
