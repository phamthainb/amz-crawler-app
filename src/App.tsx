import React, { useEffect, useState } from 'react';
import { Loader2, FileDown, Play, StopCircle, WifiPen } from 'lucide-react';

const App = () => {
  const [threads, setThreads] = useState(2);
  const [urlInput, setUrlInput] = useState('');
  // results with some example
  const [results, setResults] = useState([
    { url: 'https://example.com', title: 'Example Product', price: '$19.99', error: null },
    { url: 'https://example.com/2', title: 'Example Product 2', price: '$29.99', error: null },
    { url: 'https://example.com/3', title: 'Example Product 3', price: '$39.99', error: 'Error fetching data' },
  ]);
  // const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    window.Main.removeLoading();
  }, []);

  const handleImport = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      setUrlInput(text.trim());
    };
    fileInput.click();
  };

  const handleStart = async () => {
    const urls = urlInput.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setIsRunning(true);
    setResults([]);

    const res = await (window as any).electron.ipcRenderer.invoke('start-crawl', {
      urls,
      threads,
    });
    setResults(res);
    setIsRunning(false);
  };

  const handleStop = () => {
    alert('Stop requested');
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Config Form */}
        <div className="bg-white shadow-lg rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thread Count</label>
            <input
              type="number"
              min={1}
              max={10}
              className="w-full rounded-xl border border-gray-300 p-2"
              value={threads}
              onChange={e => setThreads(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amazon URLs</label>
            <textarea
              rows={6}
              className="w-full rounded-xl border border-gray-300 p-3 font-mono"
              placeholder="One URL per line"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex gap-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50"
              onClick={handleStart}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
              Start
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl flex items-center gap-2"
              onClick={handleStop}
              disabled={!isRunning}
            >
              <StopCircle className="w-4 h-4" /> Stop
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-black px-5 py-2 rounded-xl flex items-center gap-2"
              onClick={handleImport}
            >
              <FileDown className="w-4 h-4" /> Import URLs
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-black px-5 py-2 rounded-xl flex items-center gap-2"
              onClick={handleImport}
            >
              <WifiPen className="w-4 h-4"/>
               Proxies
            </button>
          </div>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-white shadow-md rounded-2xl p-6 overflow-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Results</h2>
            <table className="w-full text-sm text-left">
              <thead className="text-gray-600 bg-gray-100">
                <tr>
                  <th className="px-4 py-2">URL</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-blue-600 underline break-all">{r.url}</td>
                    <td className="px-4 py-2">{r.title || '-'}</td>
                    <td className="px-4 py-2">{r.price || '-'}</td>
                    <td className={`px-4 py-2 ${r.error ? 'text-red-500' : 'text-green-600'}`}>{r.error || 'Success'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;