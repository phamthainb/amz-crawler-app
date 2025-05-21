import React, { useEffect, useState } from 'react';
import { Loader2, FileDown, Play, StopCircle, WifiPen } from 'lucide-react';
import { ConfigKey } from '../shared/types';
import ImportForm from './ImportForm';
import Summary from './Summary';
import ProductTable from './ProductTable';

const App = () => {
  const [configs, setConfigs] = useState<{ id: number; key: keyof typeof ConfigKey; value: any }[]>([]);
  const [refresh, setRefresh] = useState(false);

  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    window.Main.removeLoading();
    // get data from db
    const getDataFromDB = async () => {
      // get all config
      const getAllConfig = await window.Main.database('getAllConfig', {});
      console.log('getAllConfig', getAllConfig);
      setConfigs(getAllConfig);

      // get crawler status
      const isCrawlerRunning = await window.Main.isCrawlerRunning();
      console.log('isCrawlerRunning', isCrawlerRunning);
      setIsRunning(isCrawlerRunning);
    };

    getDataFromDB();
  }, [refresh]);

  const handleStart = async () => {
    await window.Main.startCrawl();
    setRefresh((prev) => !prev);
  };

  const handleStop = async () => {
    await window.Main.stopCrawl();
    setRefresh((prev) => !prev);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto space-y-8">
        {/* Config Form */}
        <div className="flex flex-col gap-6 p-6 bg-white shadow-lg rounded-2xl">
          <div className="flex flex-row items-end gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Thread Count</label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full p-2 text-center border border-gray-300 rounded-xl"
                value={configs.find((c) => c.key === ConfigKey.threadCount)?.value || 1}
                onChange={async (e) => {
                  // update db
                  const value = e.target.value;
                  const res = await window.Main.database('setConfigValue', { key: ConfigKey.threadCount, value });

                  setRefresh((prev) => !prev);
                }}
              />
            </div>

            <button
              className="bg-gray-200 max-h-[52px] hover:bg-gray-300 text-black px-5 py-2 rounded-xl flex items-center gap-2"
              // onClick={handleImport}
            >
              <WifiPen className="w-4 h-4" />
              Proxies
            </button>

            <button
              className="flex items-center gap-2 px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
              onClick={handleStart}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 "
              onClick={handleStop}
              disabled={!isRunning}
            >
              <StopCircle className="w-4 h-4" /> Stop
            </button>
          </div>

          <Summary />

          <ImportForm />
        </div>

        <ProductTable />
      </div>
    </div>
  );
};

export default App;
