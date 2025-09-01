'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ChatInterface from '@/components/ChatInterface';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatPage() {
  const { isLoaded, userId } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [showSessionsList, setShowSessionsList] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      redirect('/sign-in');
    }
  }, [isLoaded, userId]);

  // Fetch chat sessions
  useEffect(() => {
    async function fetchSessions() {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/chat/sessions');
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    }

    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  const handleNewSession = () => {
    setCurrentSessionId(undefined);
  };

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Refresh sessions list
    fetchSessionsQuietly();
  };

  const fetchSessionsQuietly = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to refresh sessions:', err);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessionsList(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(undefined);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Show loading state while auth is loading
  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Sessions Sidebar */}
        <div className={`${showSessionsList ? 'block' : 'hidden'} lg:block w-80 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {isLoadingSessions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No chat sessions yet</p>
                <p className="text-xs mt-1">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="p-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative mb-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="pr-8">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {session.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                      aria-label="Delete session"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sessions Toggle */}
        <button
          onClick={() => setShowSessionsList(!showSessionsList)}
          className="lg:hidden fixed bottom-8 left-8 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-10"
          aria-label="Toggle chat history"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            sessionId={currentSessionId}
            onNewSession={handleNewSession}
            onSessionChange={handleSessionChange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}