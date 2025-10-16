import React from 'react';
import { HistoryLog } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { ActionIcon } from './icons/ActionIcon';
import { SystemIcon } from './icons/SystemIcon';
import { SearchIcon } from './icons/SearchIcon';

interface HistoryItemProps {
  item: HistoryLog;
}

const getIcon = (type: HistoryLog['type']) => {
  switch (type) {
    case 'user':
      return <UserIcon className="w-6 h-6 text-cyan-400" />;
    case 'thought':
      return <BotIcon className="w-6 h-6 text-fuchsia-400" />;
    case 'action':
      return <ActionIcon className="w-6 h-6 text-amber-400" />;
    case 'search_result':
      return <SearchIcon className="w-6 h-6 text-blue-400" />;
    case 'system':
    case 'error':
        return <SystemIcon className="w-6 h-6 text-slate-500"/>
    default:
      return null;
  }
};

const getTitle = (type: HistoryLog['type']) => {
    switch (type) {
      case 'user': return "User Goal";
      case 'thought': return "Gemini's Thought";
      case 'action': return "Action Taken";
      case 'system': return "System Message";
      case 'error': return "Error Occurred";
      case 'search_result': return "Web Search Result";
      default: return "";
    }
  };

export const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const { type, content, details, sources } = item;

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">{getIcon(type)}</div>
      <div className="flex-grow bg-slate-800 rounded-md p-3">
        <p className="font-bold text-slate-300 mb-1">{getTitle(type)}</p>
        <p className="text-slate-400 whitespace-pre-wrap">{content}</p>
        {details && (
            <div className="mt-2 p-2 bg-slate-900/50 rounded-md text-xs font-mono">
                <code>
                    {details.name}({Object.entries(details.args)
                        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
                        .join(', ')})
                </code>
            </div>
        )}
        {sources && sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs font-semibold text-slate-400 mb-1">Sources:</p>
                <ul className="space-y-1">
                    {sources.map((source, index) => (
                        <li key={index} className="truncate">
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-cyan-500 hover:underline"
                                title={source.uri}
                            >
                                {source.title || source.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};
