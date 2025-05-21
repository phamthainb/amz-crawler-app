import React, { useState, ChangeEvent } from 'react';

type ImportMethod = 'file' | 'text';

const cleanUrls = (urls: string[]) => {
  let a = urls
    .filter(Boolean)
    .filter((line) => line.startsWith('https://') || line.startsWith('http://'))
    .filter((line) => line.includes('amazon.com/dp/'))
    .filter((line) => line.length > 0)
    .filter((line) => line.length < 200)
    .filter((line) => !line.includes(' ')) // remove lines with spaces
    .filter((line) => !line.includes('..')) // remove lines with double dots
    .map((m) => m.trim());
  a = Array.from(new Set(a)); // remove duplicates
  return a;
};

export default function ImportForm() {
  const [method, setMethod] = useState<ImportMethod>('text');
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');

  // Handle file change and count lines
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = cleanUrls(content.split(/\r?\n/).filter(Boolean));
        setUrls(lines);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSave = async () => {
    // save urls to database
    let ok = 0,
      error = 0;
    for (const url of urls) {
      try {
        await window.Main.database('insertProduct', { url });
        ok++;
      } catch (err) {
        console.error(err);
        error++;
      }
    }

    setUrls([]);
    setFile(null);
    setTextInput('');
    alert(
      `${ok > 0 ? `Saved ${ok} URLs to the database.` : ''} ${error > 0 ? `Failed to save ${error} URLs.` : ''}`.trim()
    );
  };

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <label className="block mb-1 font-medium">Import Method:</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as ImportMethod)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="file">Import from file (.txt)</option>
          <option value="text">Enter manually</option>
        </select>
      </div>

      {method === 'file' && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Upload File:</label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <strong>File:</strong> {file.name}
              </p>
            </div>
          )}
        </div>
      )}

      {method === 'text' && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Paste URLs (one per line):</label>
          <textarea
            rows={6}
            className="w-full p-2 border border-gray-300 rounded"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              const lines = e.target.value
                .split(/\r?\n/)
                .filter(Boolean)
                .map((m) => m.trim());
              setUrls(cleanUrls(lines));
            }}
            placeholder="https://www.amazon.com/dp/... https://www.amazon.com/dp/..."
          />
        </div>
      )}

      <button
        disabled={urls.length < 1}
        onClick={handleSave}
        className="px-4 py-2 text-white transition bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Save URLs {urls.length > 0 && `(Count: ${urls.length} URLs)`}
      </button>
    </div>
  );
}
