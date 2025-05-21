import React, { useEffect, useState } from 'react';
import { Download, Eye, RefreshCcw, Trash2 } from 'lucide-react';
import { ItemStatus } from '../shared/types';

const PAGE_SIZE = 3;

export default function ProductTable() {
  const [products, setProducts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<keyof typeof ItemStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const fetchProducts = async () => {
    const data =
      statusFilter === 'all'
        ? await window.Main.database('getAllProducts', {})
        : await window.Main.database('getProductsByStatus', { status: statusFilter });
    setProducts(data);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this product?')) {
      await window.Main.database('deleteProduct', { id });
      fetchProducts();
    }
  };

  const handleExport = () => {
    const csv = products.map((p) => `"${p.id}","${p.url}","${p.status}"`).join('\n');
    const blob = new Blob([`ID,URL,Status\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginated = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            <option value="all">All</option>
            {Object.keys(ItemStatus).map((key) => (
              <option key={key} value={key}>
                {ItemStatus[key as keyof typeof ItemStatus]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchProducts}
            className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">URL</th>
              <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-2">{product.id}</td>
                <td className="px-4 py-2">{product.url}</td>
                <td className="px-4 py-2 capitalize">{product.status}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => alert(JSON.stringify(product, null, 2))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="inline w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="inline w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
