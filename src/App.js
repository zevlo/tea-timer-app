import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, TrendingUp, Settings, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TeaTimer = () => {
  // Timer state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const intervalRef = useRef(null);

  // Data state
  const [sessions, setSessions] = useState([]);
  const [activeView, setActiveView] = useState('timer');

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('teaSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('teaSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Format time display
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Timer controls
  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
    setNotes('');
  };

  const handleSave = () => {
    if (time > 0) {
      const newSession = {
        id: Date.now(),
        time: time,
        timeMinutes: time / 60000,
        date: new Date().toISOString(),
        notes: notes
      };
      setSessions([...sessions, newSession]);
      setShowSaveDialog(false);
      handleReset();
    }
  };

  // Prepare data for chart
  const getChartData = () => {
    return sessions.map((session, index) => ({
      session: index + 1,
      time: parseFloat((session.timeMinutes).toFixed(2)),
      date: new Date(session.date).toLocaleDateString()
    }));
  };

  // Calculate statistics
  const getStats = () => {
    if (sessions.length === 0) return { average: 0, shortest: 0, longest: 0 };
    
    const times = sessions.map(s => s.timeMinutes);
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const shortest = Math.min(...times);
    const longest = Math.max(...times);
    
    return {
      average: average.toFixed(2),
      shortest: shortest.toFixed(2),
      longest: longest.toFixed(2)
    };
  };

  const stats = getStats();

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Time (minutes)', 'Notes'];
    const rows = sessions.map(s => [
      new Date(s.date).toLocaleString(),
      s.timeMinutes.toFixed(2),
      s.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tea-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // SVG Tea Cup Animation
  const TeaCupSVG = () => (
    <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto mb-6">
      {/* Cup */}
      <path
        d="M50 100 Q50 160 80 180 L120 180 Q150 160 150 100 L50 100"
        fill="#8B7355"
        stroke="#6B5D4F"
        strokeWidth="2"
      />
      
      {/* Handle */}
      <path
        d="M150 120 Q170 120 170 140 Q170 160 150 160"
        fill="none"
        stroke="#6B5D4F"
        strokeWidth="2"
      />
      
      {/* Saucer */}
      <ellipse cx="100" cy="185" rx="60" ry="8" fill="#A0826D" />
      
      {/* Tea liquid */}
      <path
        d="M60 120 Q60 150 80 165 L120 165 Q140 150 140 120 L60 120"
        fill="#D2691E"
        opacity="0.8"
      />
      
      {/* Steam */}
      {isRunning && (
        <>
          <path
            d="M80 90 Q75 70 80 50"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="2"
            opacity="0.6"
            className="animate-pulse"
          />
          <path
            d="M100 90 Q105 70 100 50"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="2"
            opacity="0.6"
            className="animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
          <path
            d="M120 90 Q115 70 120 50"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="2"
            opacity="0.6"
            className="animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </>
      )}
    </svg>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-white p-4 shadow-sm">
        <h1 className="text-2xl font-light text-center tracking-wide">Tea Timer</h1>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-stone-200 bg-white">
        <button
          onClick={() => setActiveView('timer')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all ${
            activeView === 'timer' 
              ? 'text-amber-700 border-b-2 border-amber-700' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Clock size={18} />
          <span className="font-light">Timer</span>
        </button>
        <button
          onClick={() => setActiveView('trends')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all ${
            activeView === 'trends' 
              ? 'text-amber-700 border-b-2 border-amber-700' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <TrendingUp size={18} />
          <span className="font-light">Trends</span>
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-all ${
            activeView === 'settings' 
              ? 'text-amber-700 border-b-2 border-amber-700' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Settings size={18} />
          <span className="font-light">Settings</span>
        </button>
      </div>

      {/* Timer View */}
      {activeView === 'timer' && (
        <div className="p-6 max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
            {/* Tea Cup Image */}
            <TeaCupSVG />

            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className="text-5xl font-light text-stone-800 mb-2 tracking-wider">
                {formatTime(time)}
              </div>
              <div className="text-stone-400 text-sm tracking-wide uppercase">Minutes : Seconds</div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 justify-center mb-6">
              <button
                onClick={handleStartStop}
                className={`p-5 rounded-full transition-all transform hover:scale-105 shadow-md ${
                  isRunning 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
                } text-white`}
              >
                {isRunning ? <Pause size={24} strokeWidth={1.5} /> : <Play size={24} strokeWidth={1.5} />}
              </button>
              <button
                onClick={handleReset}
                className="p-5 rounded-full bg-stone-600 hover:bg-stone-700 text-white shadow-md transition-all transform hover:scale-105"
              >
                <RotateCcw size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Save Button */}
            {time > 0 && !isRunning && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-light tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} strokeWidth={1.5} />
                Save Session
              </button>
            )}
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-stone-200 p-4">
              <h3 className="font-light text-stone-700 mb-3 tracking-wide">Recent Sessions</h3>
              <div className="space-y-2">
                {sessions.slice(-3).reverse().map(session => (
                  <div key={session.id} className="flex justify-between text-sm">
                    <span className="text-stone-500">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="text-stone-700">
                      {session.timeMinutes.toFixed(2)} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends View */}
      {activeView === 'trends' && (
        <div className="p-6 max-w-4xl mx-auto">
          {sessions.length > 0 ? (
            <>
              {/* Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-6">
                <h3 className="text-xl font-light mb-4 text-stone-700 tracking-wide">Brewing Time Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis 
                      dataKey="session" 
                      label={{ value: 'Session', position: 'insideBottom', offset: -5 }}
                      stroke="#78716c"
                    />
                    <YAxis 
                      label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }}
                      stroke="#78716c"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fafaf9', 
                        border: '1px solid #e7e5e4',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="time" 
                      stroke="#d97706" 
                      strokeWidth={2}
                      dot={{ fill: '#d97706', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 text-center">
                  <div className="text-stone-500 text-sm mb-1 font-light">Average</div>
                  <div className="text-2xl font-light text-amber-700">{stats.average}</div>
                  <div className="text-stone-400 text-xs">minutes</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 text-center">
                  <div className="text-stone-500 text-sm mb-1 font-light">Shortest</div>
                  <div className="text-2xl font-light text-emerald-700">{stats.shortest}</div>
                  <div className="text-stone-400 text-xs">minutes</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4 text-center">
                  <div className="text-stone-500 text-sm mb-1 font-light">Longest</div>
                  <div className="text-2xl font-light text-rose-700">{stats.longest}</div>
                  <div className="text-stone-400 text-xs">minutes</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 text-center">
              <TrendingUp size={48} className="mx-auto text-stone-300 mb-4" strokeWidth={1.5} />
              <p className="text-stone-600 font-light">No brewing sessions recorded yet.</p>
              <p className="text-stone-400 text-sm mt-2">Start timing your tea brewing to see trends!</p>
            </div>
          )}
        </div>
      )}

      {/* Settings View */}
      {activeView === 'settings' && (
        <div className="p-6 max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 space-y-4">
            <h3 className="text-xl font-light mb-4 text-stone-700 tracking-wide">Settings</h3>
            
            <button
              onClick={exportToCSV}
              className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-light tracking-wide transition-colors disabled:bg-stone-300"
              disabled={sessions.length === 0}
            >
              Export Data to CSV
            </button>
            
            <div className="pt-4 border-t border-stone-200">
              <div className="text-sm text-stone-500 font-light">
                <p>Total Sessions: <span className="text-stone-700">{sessions.length}</span></p>
                <p className="mt-1 text-xs">
                  Data stored locally on this device
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-stone-200 p-6 w-full max-w-sm">
            <h3 className="text-xl font-light mb-4 text-stone-700 tracking-wide">Save Session</h3>
            <div className="mb-4">
              <div className="text-3xl font-light text-center text-amber-700 mb-2 tracking-wider">
                {formatTime(time)}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-light text-stone-600 mb-1 tracking-wide">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent font-light"
                placeholder="e.g., Green tea, 80°C"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg font-light tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-light tracking-wide transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeaTimer;