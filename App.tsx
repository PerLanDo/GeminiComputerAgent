import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { AgentView } from './components/AgentView';
import { getComputerAction, performWebSearch } from './services/geminiService';
import { HistoryLog, GeminiAction, AgentStatus } from './types';
import { imageUrlToBase64 } from './utils/imageHelper';

const App: React.FC = () => {
  const [task, setTask] = useState<string>('');
  const [url, setUrl] = useState<string>('https://google.com/search?q=latest+news');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [currentAction, setCurrentAction] = useState<GeminiAction | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const historyRef = useRef(history);
  historyRef.current = history;

  const runAgentLoop = useCallback(async () => {
    if (status !== AgentStatus.THINKING) return;
    
    setError(null);
    setCurrentAction(null);

    try {
        const screenshotBase64 = await imageUrlToBase64(screenshotUrl);
        const latestHistory = historyRef.current;
        
        const response = await getComputerAction(task, screenshotBase64, latestHistory);

        if (response.action) {
            const action = response.action;
            const thoughtHistory: HistoryLog = { type: 'thought', content: response.thought };
            const actionHistory: HistoryLog = { type: 'action', content: action.description, details: action };

            if (action.name === 'search_web') {
                setHistory(prev => [...prev, thoughtHistory, actionHistory]);
                setStatus(AgentStatus.SEARCHING);
                const searchResults = await performWebSearch(action.args.query);
                const resultHistory: HistoryLog = {
                    type: 'search_result',
                    content: searchResults.text,
                    sources: searchResults.sources
                };
                setHistory(prev => [...prev, resultHistory]);
                setStatus(AgentStatus.THINKING); // Re-trigger loop with new knowledge
            } else {
                setHistory(prev => [...prev, thoughtHistory, actionHistory]);
                setCurrentAction(action);
                setStatus(AgentStatus.EXECUTING);
    
                if (action.name === 'finish_task') {
                    setIsRunning(false);
                    setStatus(AgentStatus.FINISHED);
                } else {
                     // Simulate action execution and taking a new screenshot
                    setTimeout(() => {
                        setScreenshotCount(prev => prev + 1);
                        setStatus(AgentStatus.TAKING_SCREENSHOT);
                    }, 3000);
                }
            }

        } else {
            throw new Error('Model did not return a valid action.');
        }

    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        setHistory(prev => [...prev, { type: 'error', content: `Error: ${errorMessage}` }]);
        setIsRunning(false);
        setStatus(AgentStatus.IDLE);
    }
  }, [status, task, screenshotUrl]);

  useEffect(() => {
    if (status === AgentStatus.TAKING_SCREENSHOT) {
      const newScreenshotUrl = `https://picsum.photos/1280/720?random=${screenshotCount}`;
      setScreenshotUrl(newScreenshotUrl);
      // The useEffect below will handle the next step
    }
  }, [status, screenshotCount]);
  
  // This effect triggers when a new screenshot is "taken"
  useEffect(() => {
    if (screenshotUrl && status === AgentStatus.TAKING_SCREENSHOT) {
      const message = isRunning 
        ? `Captured new screenshot (${screenshotCount}).`
        : 'New page loaded.';
      setHistory(prev => [...prev, {type: 'system', content: message}]);
      if (isRunning) {
        setStatus(AgentStatus.THINKING);
      } else {
        setStatus(AgentStatus.IDLE);
      }
    }
  }, [isRunning, screenshotUrl, status, screenshotCount]);


  useEffect(() => {
    if (isRunning && status === AgentStatus.THINKING) {
        runAgentLoop();
    }
  }, [isRunning, status, runAgentLoop]);
  
  const handleStart = (startUrl: string, startTask: string) => {
    if (!startUrl || !startTask) {
      alert('Please provide a URL and a task.');
      return;
    }
    setUrl(startUrl);
    setTask(startTask);
    setIsRunning(true);
    setHistory([{ type: 'user', content: `Goal: ${startTask} at ${startUrl}` }]);
    setScreenshotCount(1);
    setStatus(AgentStatus.TAKING_SCREENSHOT);
    setError(null);
  };

  const handleStop = () => {
    setIsRunning(false);
    setStatus(AgentStatus.IDLE);
    setCurrentAction(null);
    setHistory(prev => [...prev, {type: 'system', content: 'Agent stopped by user.'}]);
  };

  const handleNavigate = (newUrl: string) => {
    if (isRunning) {
        alert("Please stop the agent before navigating manually.");
        return;
    }
    setUrl(newUrl);
    setHistory(prev => [...prev, {type: 'user', content: `Navigating to ${newUrl}`}]);
    setScreenshotCount(prev => prev + 1);
    setStatus(AgentStatus.TAKING_SCREENSHOT);
  };
  
  const handleManualSearch = async (query: string) => {
    setHistory(prev => [...prev, {type: 'user', content: `Manual Search: "${query}"`}]);
    try {
        const searchResults = await performWebSearch(query);
        const resultHistory: HistoryLog = {
            type: 'search_result',
            content: searchResults.text,
            sources: searchResults.sources
        };
        setHistory(prev => [...prev, resultHistory]);
    } catch(err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setHistory(prev => [...prev, { type: 'error', content: `Search failed: ${errorMessage}` }]);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <header className="bg-slate-950/70 backdrop-blur-sm p-4 border-b border-slate-700 shadow-lg">
        <h1 className="text-2xl font-bold text-cyan-400">Gemini Computer Agent</h1>
        <p className="text-sm text-slate-400">A web-based simulation of a browser automation agent powered by Gemini.</p>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <div className="lg:col-span-1 bg-slate-800/50 rounded-lg shadow-2xl p-4 flex flex-col h-[calc(100vh-100px)]">
          <ControlPanel 
            onStart={handleStart} 
            onStop={handleStop}
            onManualSearch={handleManualSearch}
            isRunning={isRunning}
            history={history}
            status={status}
            error={error}
            initialUrl={url}
          />
        </div>
        <div className="lg:col-span-2 bg-slate-800/50 rounded-lg shadow-2xl p-4 flex flex-col h-[calc(100vh-100px)]">
          <AgentView 
            screenshotUrl={screenshotUrl}
            action={currentAction}
            status={status}
            url={url}
            isRunning={isRunning}
            onNavigate={handleNavigate}
          />
        </div>
      </main>
    </div>
  );
};

export default App;