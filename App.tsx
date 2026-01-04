
import React, { useState, useEffect } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import SummaryCard from './components/SummaryCard';
import { VoiceNoteSummary, AppStatus } from './types';
import { processVoiceNote } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [history, setHistory] = useState<VoiceNoteSummary[]>([]);
  const [currentNote, setCurrentNote] = useState<VoiceNoteSummary | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vox_notes_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const handleRecordingComplete = async (base64: string, mimeType: string) => {
    setStatus('processing');
    try {
      const result = await processVoiceNote(base64, mimeType);
      
      const newNote: VoiceNoteSummary = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      setCurrentNote(newNote);
      const updatedHistory = [newNote, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('vox_notes_history', JSON.stringify(updatedHistory));
      setStatus('success');
    } catch (err) {
      console.error("Failed to process voice note:", err);
      setStatus('error');
    }
  };

  const deleteNote = (id: string) => {
    const updated = history.filter(n => n.id !== id);
    setHistory(updated);
    localStorage.setItem('vox_notes_history', JSON.stringify(updated));
    if (currentNote?.id === id) setCurrentNote(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">VoxSummarize <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-gray-500 font-medium">Capture ideas. Get summaries.</span>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recorder and Current result */}
        <div className="lg:col-span-7 space-y-8">
          <VoiceRecorder 
            onRecordingComplete={handleRecordingComplete}
            isProcessing={status === 'processing'}
          />

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-in fade-in zoom-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Something went wrong during processing. Please try again.
            </div>
          )}

          {currentNote && <SummaryCard note={currentNote} />}
          
          {!currentNote && status === 'idle' && (
            <div className="p-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center opacity-50">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 font-medium">Your processed summary will appear here</p>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Notes</h2>
            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
              {history.length} Saved
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">No notes recorded yet.</p>
              </div>
            ) : (
              history.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => setCurrentNote(note)}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
                    currentNote?.id === note.id 
                      ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-opacity-20' 
                      : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-sm truncate pr-4 ${currentNote?.id === note.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {note.title}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {note.summary}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                    <div className="flex -space-x-1">
                      {note.actionItems.length > 0 && (
                        <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center ring-2 ring-white" title="Has action items">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <p>© 2024 VoxSummarize AI • Powered by Gemini 3</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-600">Privacy</a>
            <a href="#" className="hover:text-indigo-600">Terms</a>
            <a href="#" className="hover:text-indigo-600">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
