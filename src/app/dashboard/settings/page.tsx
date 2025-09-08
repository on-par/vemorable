'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { userId } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExportData = async () => {
    if (!userId) {
      setExportMessage({ type: 'error', text: 'You must be logged in to export data' });
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    try {
      const response = await fetch('/api/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'vemorable-export.json';

      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportMessage({ type: 'success', text: 'Your data has been exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setExportMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export data. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and application preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {/* Account Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">User ID</p>
                  <p className="text-sm text-gray-500">{userId || 'Not available'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Export Your Data</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Download a complete copy of your notes, chat sessions, and related data in JSON format.
                </p>
                
                {/* Export Button */}
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isExporting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Data
                    </>
                  )}
                </button>

                {/* Export Message */}
                {exportMessage && (
                  <div className={`mt-4 p-4 rounded-md ${
                    exportMessage.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {exportMessage.type === 'success' ? (
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">
                          {exportMessage.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Your data is encrypted and stored securely. Only you have access to your notes and chat sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}