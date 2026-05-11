import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertCircle, Plus, DollarSign, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductWorkspace } from '../components/products/ProductWorkspace';
import { AddStockModal } from '../components/stock/AddStockModal';
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { usePermissions } from '../hooks/usePermissions';
import { useDebounce } from '../hooks/useUtils';
import { EmptyState, SkeletonTable, SkeletonCards } from '../components/ui/EmptyState';

export function StockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const { canCreate } = usePermissions();
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: snapshotsData, isLoading } = useQuery({
    queryKey: ['stock-snapshots'],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch('/api/stock/snapshots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao buscar estoque');
      return (await res.json()).data;
    }
  });

  const snapshots = snapshotsData || [];

  const filteredSnapshots = snapshots.filter((snap: any) => {
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    return (
      snap.product?.name?.toLowerCase().includes(term) || 
      snap.product?.sku?.toLowerCase().includes(term)
    );
  });

  const lowStockItems = snapshots.filter((snap: any) => snap.quantity <= (snap.product?.minStock || 0));
  const totalValuation = snapshots.reduce((acc: number, snap: any) => acc + (snap.quantity * (snap.lastCost || snap.product?.costPrice || 0)), 0);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => {
        const snap = row.original;
        return (
          <button
            onClick={() => setSelectedProductId(snap.productId)}
            className="font-mono text-xs font-bold text-neutral-500 hover:text-indigo-600 hover:underline transition-colors text-left"
          >
            {snap.product?.sku || snap.productId.substring(0, 8)}
          </button>
        );
      }
    },
    {
      accessorKey: 'name',
      header: 'Produto',
      cell: ({ row }) => {
        const snap = row.original;
        const isLow = snap.quantity <= (snap.product?.minStock || 0);
        return (
          <button
            onClick={() => setSelectedProductId(snap.productId)}
            className="font-semibold text-neutral-900 flex items-center gap-2 hover:text-indigo-600 hover:underline text-left"
          >
            <span className="truncate max-w-[200px]">{snap.product?.name || 'Desconhecido'}</span>
            {isLow && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" title="Estoque Crítico" />
            )}
          </button>
        );
      }
    },
    {
      accessorKey: 'quantity',
      header: 'Estoque',
      cell: ({ row }) => {
        const snap = row.original;
        const isLow = snap.quantity <= (snap.product?.minStock || 0);
        return (
          <span className={`inline-flex px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {snap.quantity}
          </span>
        );
      }
    },
    {
      accessorKey: 'price',
      header: 'Preço (Venda)',
      cell: ({ row }) => {
        const snap = row.original;
        return (
          <span className="font-mono font-bold text-neutral-800">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snap.product?.price || 0)}
          </span>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const snap = row.original;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${snap.product?.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-neutral-50 text-neutral-500 border border-neutral-200'}`}>
            {snap.product?.isActive ? 'Ativo' : 'Inativo'}
          </span>
        );
      }
    }
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Gestão de Estoque</h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie inventário físico, custos e movimentações.</p>
        </div>
        {canCreate('stock') && (
          <button
            onClick={() => setIsAddStockOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-50 hover:shadow-lg transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto ao Estoque</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="mb-8"><SkeletonCards count={3} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-neutral-400 mb-1 truncate">Itens em Estoque</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-neutral-900 truncate">{snapshots.length}</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl flex-shrink-0"><Box className="w-5 h-5" /></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-neutral-400 mb-1 truncate">Valuation (Custo)</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-neutral-900 truncate">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValuation)}
              </h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl flex-shrink-0"><DollarSign className="w-5 h-5" /></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-neutral-400 mb-1 truncate">Alertas de Ruptura</p>
              <h3 className={`text-xl sm:text-2xl md:text-3xl font-black font-mono truncate ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
                {lowStockItems.length}
              </h3>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-neutral-50 text-neutral-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden mb-6">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6"><SkeletonTable rows={5} cols={5} /></div>
        ) : filteredSnapshots.length === 0 ? (
          <EmptyState 
            icon={Box} 
            title="Nenhum produto no estoque" 
            description="Adicione produtos para começar a controlar seu inventário."
            action={canCreate('stock') ? { label: 'Adicionar Produto', onClick: () => setIsAddStockOpen(true) } : undefined}
          />
        ) : (
          <div className="p-4 sm:p-6 overflow-x-auto">
            <DataTable columns={columns} data={filteredSnapshots} />
          </div>
        )}
      </div>

      {selectedProductId && (
        <ProductWorkspace 
          productId={selectedProductId} 
          onClose={() => setSelectedProductId(null)} 
        />
      )}

      {isAddStockOpen && (
        <AddStockModal onClose={() => setIsAddStockOpen(false)} />
      )}
    </MainLayout>
  );
}
