import React, { useState, useEffect } from 'react';
import { GeminiAction, AgentStatus } from '../types';

interface AgentViewProps {
  screenshotUrl: string | null;
  action: GeminiAction | null;
  status: AgentStatus;
  url: string;
  isRunning: boolean;
  onNavigate: (newUrl: string) => void;
}

const ActionVisualization: React.FC<{ action: GeminiAction }> = ({ action }) => {
  const { name, args } = action;
  const x = args.x;
  const y = args.y;

  if (name === 'click_at' && x !== undefined && y !== undefined) {
    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        <div className="w-8 h-8 rounded-full border-4 border-red-500 bg-red-500/30 animate-ping"></div>
        <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full border-2 border-white bg-red-500 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    );
  }

  if (name === 'type_text_at' && x !== undefined && y !== undefined) {
    return (
      <div
        className="absolute transform -translate-x-1/2"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        <div className="bg-black/70 text-white p-2 rounded-md shadow-lg text-lg animate-pulse">
            Typing: "{args.text}"
        </div>
      </div>
    );
  }

  return null;
};


export const AgentView: React.FC<AgentViewProps> = ({ screenshotUrl, action, status, url, isRunning, onNavigate }) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const showAction = action && status === AgentStatus.EXECUTING;
  const showLoader = [
    AgentStatus.TAKING_SCREENSHOT,
    AgentStatus.THINKING,
    AgentStatus.SEARCHING
  ].includes(status);

  useEffect(() => {
    setCurrentUrl(url);
  }, [url]);

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNavigate(currentUrl);
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden">
      {/* Browser chrome */}
      <div className="flex-shrink-0 bg-slate-700 p-2 flex items-center space-x-2">
        <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <input 
          type="text"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          onKeyDown={handleUrlKeyDown}
          disabled={isRunning}
          className="flex-grow bg-slate-800 text-slate-300 text-xs rounded-full px-4 py-1.5 truncate focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed"
          placeholder="https://example.com"
        />
      </div>
      
      {/* Screenshot view */}
      <div className="flex-grow relative bg-slate-950 flex items-center justify-center">
        {(isRunning || screenshotUrl) ? (
          <div className="relative w-full h-full">
            <img
              key={screenshotUrl} // Re-renders the img tag to show animation
              src={screenshotUrl || ''}
              alt="Agent's view of the webpage"
              className="w-full h-full object-contain animate-fade-in"
              style={{ animation: 'fadeIn 0.5s ease-in-out' }}
            />
            {showAction && <ActionVisualization action={action} />}
          </div>
        ) : (
          <div className="text-center text-slate-500">
            <h2 className="text-2xl font-semibold">Agent is Idle</h2>
            <p>Enter a URL and task to begin, or navigate directly using the URL bar.</p>
          </div>
        )}
        {showLoader && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
                <p className="mt-4 text-lg font-semibold">{status}</p>
             </div>
        )}
      </div>
       <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
       `}</style>
    </div>
  );
};