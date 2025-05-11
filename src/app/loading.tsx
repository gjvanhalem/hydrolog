'use client';

export default function Loading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <span className="ml-3 text-gray-600">Loading...</span>
    </div>
  );
}
