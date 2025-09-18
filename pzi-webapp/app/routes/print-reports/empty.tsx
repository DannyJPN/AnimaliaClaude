import React from 'react';

export default function EmptyPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <h2 className="text-xl font-semibold mb-2">No Report Selected</h2>
        <p>Please select a report from the list to view details</p>
      </div>
    </div>
  );
}
