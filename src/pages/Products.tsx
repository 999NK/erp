import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Package, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { ProductModal } from '../components/products/ProductModal';
import { ProductImportModal } from '../components/products/ProductImportModal';
import { usePermissions } from '../hooks/usePermissions';
import { apiFetch } from '../hooks/useUtils';
import { EmptyState, SkeletonTable } from '../components/ui/EmptyState';

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  isActive: boolean;
};

export function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { canCreate } = usePermissions();

  const { data: dataResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiFetch('/api/products');
      if (!response.success) throw new Error(response.message || 'Falha ao buscar produtos');
      return response;
    }
  });

  const products = dataResponse?.data || [];

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Nome do Produto',
      cell: ({ row }) => <span className="font-medium text-neutral-900 truncate max-w-[200px] block">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <span className="font-mono text-xs text-neutral-500">{row.getValue('sku') || '—'}</span>,
    },
    {
      accessorKey: 'barcode',
      header: 'Cód. Barras',
      cell: ({ row }) => <span className="font-mono text-xs text-neutral-400">{row.getValue('barcode') || '—'}</span>,
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('price'));
        const formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(amount);
        return <span className="text-emerald-700 font-bold font-mono">{formatted}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isActive ? 'Ativo' : 'Inativo'}
          </span>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900">Produtos</h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie seu catálogo, preços e indicadores de estoque.</p>
        </div>
        {canCreate('products') && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-300/80 px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-all shadow-sm cursor-pointer flex-shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Importar XML/Excel</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-all shadow-md shadow-indigo-50 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>
        )}
      </div>

      {error instanceof Error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-200 font-medium">
          {(error as Error).message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
        {isLoading ? (
          <div className="p-6"><SkeletonTable rows={6} cols={5} /></div>
        ) : products.length === 0 ? (
          <EmptyState 
            icon={Package}
            title="Nenhum produto cadastrado"
            description="Adicione seu primeiro produto para começar a gerenciar o catálogo."
            action={canCreate('products') ? { label: 'Adicionar Produto', onClick: () => setIsModalOpen(true) } : undefined}
          />
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 overflow-x-auto">
            <DataTable columns={columns} data={products} />
          </motion.div>
        )}
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ProductImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => {
          refetch();
        }} 
      />
    </MainLayout>
  );
}
