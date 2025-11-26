import React from 'react';
import { HistoryItem } from '../types';
import { Clock } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Detection Log
        </h3>
        <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">Last {history.length}</span>
      </div>
      
      <div className="overflow-y-auto p-2 flex-1 space-y-2 max-h-[300px] lg:max-h-none">
        {history.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm italic">
            No gestures detected yet...
          </div>
        ) : (
          history.map((item) => (
            <div key={item.timestamp} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
              <div className="text-2xl">{item.result.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-200 truncate">{item.result.gesture}</p>
                <p className="text-xs text-slate-400 truncate">{item.result.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-cyan-400">
                  {Math.round(item.result.confidence * 100)}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;