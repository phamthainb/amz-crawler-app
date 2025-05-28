// src/components/Summary.tsx
import React, { useEffect } from 'react';

import { Upload, LoaderCircle, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';
import { ItemStatus } from '../shared/types';
import { ipcMain } from 'electron';

type StatusSummary = {
  [key in keyof typeof ItemStatus]: number;
};

const statusMeta: Record<keyof typeof ItemStatus, { label: string; icon: React.ReactNode; color: string }> = {
  import: {
    label: 'Import',
    icon: <Upload className="w-5 h-5 text-gray-600" />,
    color: 'bg-gray-100 text-gray-700'
  },
  processing: {
    label: 'Processing',
    icon: <LoaderCircle className="w-5 h-5 text-yellow-600 animate-spin" />,
    color: 'bg-yellow-100 text-yellow-700'
  },
  done: {
    label: 'Done',
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    color: 'bg-green-100 text-green-700'
  },
  error: {
    label: 'Error',
    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    color: 'bg-red-100 text-red-700'
  }
};

export default function Summary() {
  const [data, setData] = React.useState<StatusSummary>({
    import: 0,
    processing: 0,
    done: 0,
    error: 0
  });

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    const fetchData = async () => {
      const summary = await window.Main.database('getProductSummary', {});
      console.log('summary', summary);
      const statusSummary: StatusSummary = {
        import: 0,
        processing: 0,
        done: 0,
        error: 0
      };
      if (Object.keys(summary).length > 0) {
        // summary is an object with keys as status and values as count
        // for example: { import: 10, processing: 5, done: 20, error: 2 }
        // so we need to map it to the statusSummary object
        Object.entries(summary).forEach(([key, value]) => {
          if (key in statusSummary) {
            statusSummary[key as keyof typeof ItemStatus] = value as number;
          }
        });
        setData(statusSummary);
      }
    };
    fetchData();

    const interval = setInterval(async () => {
      // if (await window.Main.isCrawlerRunning()) {
      fetchData();
      // }
    }, 5000); // Fetch data every 5 seconds
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-5 gap-5">
      {Object.entries(ItemStatus).map(([key]) => {
        const meta = statusMeta[key as keyof typeof ItemStatus];
        return (
          <div
            key={key}
            className={`rounded p-3 text-center ${meta.color} flex flex-col items-center justify-center gap-1`}
          >
            {meta.icon}
            <div className="text-sm font-medium">{meta.label}</div>
            <div className="text-lg font-bold">{data[key as keyof typeof ItemStatus] ?? 0}</div>
          </div>
        );
      })}
      <div
        className={`rounded p-3 text-center text-blue-700 bg-blue-100  flex flex-col items-center justify-center gap-1`}
      >
        <div className="text-sm font-medium">Total</div>
        <div className="text-lg font-bold">{total}</div>
      </div>
    </div>
  );
}
