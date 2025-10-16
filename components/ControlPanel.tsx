import React, { useState, useEffect, useRef } from 'react';
import { HistoryLog, AgentStatus } from '../types';
import { HistoryItem } from './HistoryItem';
import { SearchIcon } from './icons/SearchIcon';

interface ControlPanelProps {
  onStart: (url: string, task: string) => void;
  onStop: () => void;
  onManualSearch: (query: string) => Promise<void>;
  isRunning: boolean;
  history: HistoryLog[];
  status: AgentStatus;
  error: string | null;
  initialUrl: string;
}

const ManualSearch: React.FC<{onSearch: (query: string) => Promise<void>}> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsSearching(true);
        await onSearch(query);
        setIsSearching(false);
        setQuery('');
    }

    return (
        <form onSubmit={handleSearchSubmit} className="mb-4">
            <label htmlFor="manual_search" className="block text-slate-400 mb-1 font-semibold">Manual Web Search</label>
            <div className="flex space-x-2">
                <input
                    id="manual_search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Search for information..."
                    disabled={isSearching}
                />
                <button type="submit" disabled={isSearching || !query.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center w-24">
                   {isSearching ? (
                     <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                   ) : (
                     <><SearchIcon className="w-5 h-5 mr-2" /> Search</>
                   )}
                </button>
            </div>
        </form>
    )
}


export const ControlPanel: React.FC<ControlPanelProps> = ({ onStart, onStop, onManualSearch, isRunning, history, status, error, initialUrl }) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [task, setTask] = useState<string>('Find the top 3 latest news headlines and summarize them.');
  const historyEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl])

  const scrollToBottom = () => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(url, task);
  };
  
  const getStatusIndicator = () => {
      let color = 'bg-yellow-500'; // Default for THINKING, TAKING_SCREENSHOT
      if(status === AgentStatus.IDLE || status === AgentStatus.FINISHED) color = 'bg-gray-500';
      if(status === AgentStatus.EXECUTING) color = 'bg-green-500';
      if(status === AgentStatus.SEARCHING) color = 'bg-blue-500';
      if(error) color = 'bg-red-500';

      return (
          <div className="flex items-center space-x-2">
              <span className={`relative flex h-3 w-3`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
              </span>
              <span>{error ? "Error" : status}</span>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex-shrink-0">
        <ManualSearch onSearch={onManualSearch} />

        <div className="border-t border-slate-700 my-4"></div>

        {!isRunning && status !== AgentStatus.FINISHED ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-4">
             <h2 className="text-slate-400 font-semibold">Start Agent</h2>
            <div>
              <label htmlFor="url" className="block text-slate-400 mb-1">Target URL</label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label htmlFor="task" className="block text-slate-400 mb-1">Task</label>
              <textarea
                id="task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., Log in with username 'test' and password '1234'"
              />
            </div>
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Start Agent
            </button>
          </form>
        ) : (
            <div className="flex justify-between items-center mb-4">
                 <div className="font-semibold text-lg">{getStatusIndicator()}</div>
                <button onClick={onStop} disabled={!isRunning} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                Stop Agent
                </button>
            </div>
        )}
      </div>

      <div className="flex-grow bg-slate-900 rounded-lg p-3 overflow-y-auto space-y-4">
        <h3 className="font-semibold text-slate-400">History Log</h3>
        {history.length === 0 && <p className="text-slate-500 text-center py-4">History is empty.</p>}
        {history.map((item, index) => (
          <HistoryItem key={index} item={item} />
        ))}
         {error && <div className="text-red-400 p-2 bg-red-900/50 rounded-md"><strong>Error:</strong> {error}</div>}
        <div ref={historyEndRef} />
      </div>
    </div>
  );
};