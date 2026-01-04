
import React, { useState } from 'react';
import { VoiceNoteSummary } from '../types';
import { generateSpeech } from '../services/geminiService';

interface SummaryCardProps {
  note: VoiceNoteSummary;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ note }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcription'>('summary');

  const handlePlaySummary = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const audioBase64 = await generateSpeech(note.summary);
      const audioData = atob(audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(new Uint8Array(arrayBuffer), audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (err) {
      console.error("Speech synthesis failed:", err);
      setIsPlaying(false);
    }
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white leading-tight">{note.title}</h3>
          <p className="text-indigo-100 text-sm mt-1">
            {new Date(note.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <button
          onClick={handlePlaySummary}
          disabled={isPlaying}
          className={`p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50`}
          title="Listen to summary"
        >
          {isPlaying ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'summary' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('transcription')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'transcription' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Full Text
          </button>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Summary</h4>
              <p className="text-gray-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4">
                {note.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {note.keyPoints.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Action Items
                </h4>
                <ul className="space-y-2">
                  {note.actionItems.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-800 bg-orange-50 p-2 rounded-lg border border-orange-100 flex items-center gap-2">
                      <input type="checkbox" className="rounded border-orange-300 text-orange-500 focus:ring-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {note.transcription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
