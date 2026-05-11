import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../lib/formatters';
import { Search, Filter, Eye, X, Receipt, ShoppingBag } from 'lucide-react';
import { DataTable } from '../components/ui/data-table';
import { Modal } from '../components/ui/Modal';

type SaleItem = {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  netPrice: number;
  total: number;
  product?: { name: string; sku: string };
};

type SalePayment = {
  id: string;
  method: string;
  amount: number;
};

type SaleRow = {
  id: string;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  customer?: { id: string; name: string; document: string } | null;
  user: { id: string; name: string };
  items: SaleItem[];
  payments: SalePayment[];
};

export function SalesHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);

  const token = localStorage.getItem('@ERP:token');

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (startDate) q.set('startDate', new Date(startDate).toISOString());
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    q.set('endDate', end.toISOString());
  }
  if (debouncedCustomerSearch) q.set('customerName', debouncedCustomerSearch);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales_history', page, startDate, endDate, debouncedCustomerSearch],
    queryFn: async () => {
      const res = await fetch(`/api/sales?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch sales');
      const json = await res.json();
      return json;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedCustomerSearch(customerSearch);
    setPage(1);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCustomerSearch('');
    setDebouncedCustomerSearch('');
    setPage(1);
  };

  const columns: ColumnDef<SaleRow>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-neutral-400 font-mono text-xs font-semibold">{row.original.id.split('-')[0].toUpperCase()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Data/Hora',
      cell: ({ row }) => <span className="font-medium text-neutral-600">{format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>,
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => <span className="font-semibold text-neutral-800">{row.original.customer?.name || <span className="text-neutral-400 italic">Consumidor Final</span>}</span>,
    },
    {
      accessorKey: 'user',
      header: 'Vendedor',
      cell: ({ row }) => <span className="text-neutral-500 font-semibold">{row.original.user?.name}</span>,
    },
    {
      accessorKey: 'netAmount',
      header: 'Valor Total',
      cell: ({ row }) => <span className="font-mono font-bold text-neutral-900">{formatCurrency(row.original.netAmount)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const val = row.original.status;
        return (
          <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
            val === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {val === 'COMPLETED' ? 'CONCLUÍDA' : 'CANCELADA'}
          </span>
        );
      }
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedSale(row.original)}
          className="text-indigo-600 hover:text-indigo-800 p-2 rounded-xl hover:bg-indigo-50/60 transition-colors cursor-pointer"
          title="Ver Detalhes"
        >
          <Eye size={18} />
        </button>
      )
    },
  ];

  const pageTotal = data?.data?.reduce((acc: number, curr: SaleRow) => acc + curr.netAmount, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Histórico de Vendas</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitore, filtre e emita cupons fiscais das vendas do PDV.</p>
        </div>

        {/* Filters Panel with mobile stacked grids */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Cliente</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Nome do cliente..."
                  className="pl-10 block w-full rounded-xl border border-neutral-200 focus:border-indigo-500 bg-neutral-50/50 p-2.5 text-sm focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Data Inicial</label>
              <input
                type="date"
                className="block w-full rounded-xl border border-neutral-200 focus:border-indigo-500 bg-neutral-50/50 p-2.5 text-sm focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Data Final</label>
              <input
                type="date"
                className="block w-full rounded-xl border border-neutral-200 focus:border-indigo-500 bg-neutral-50/50 p-2.5 text-sm focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl shadow-md shadow-indigo-50 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all cursor-pointer"
              >
                <Filter size={16} className="mr-2" />
                Filtrar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 bg-white hover:bg-neutral-50 focus:outline-none transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </form>
        </div>

        {/* Data List (DataTable handles mobile/desktop seamlessly) */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-4 sm:p-6 space-y-4">
          <DataTable columns={columns} data={data?.data || []} />

          {/* Pagination and summary cards */}
          {data?.meta && (
            <div className="bg-neutral-50/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between border border-neutral-100 gap-4">
              <div className="text-xs sm:text-sm text-neutral-500 font-semibold text-center md:text-left">
                Total do Período/Página:{' '}
                <span className="font-bold text-neutral-900 font-mono">{formatCurrency(pageTotal)}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="text-xs text-neutral-400 font-semibold text-center">
                  Página <span className="font-bold text-neutral-700">{data.meta.page}</span> de{' '}
                  <span className="font-bold text-neutral-700">{data.meta.totalPages || 1}</span>{' '}
                  ({data.meta.total} registros)
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex-1 sm:flex-initial px-4 py-1.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page >= data.meta.totalPages}
                    className="flex-1 sm:flex-initial px-4 py-1.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sale Details: Using our newly refactored responsive slide-up sheet/modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Detalhes do Pedido"
        size="2xl"
      >
        {selectedSale && (
          <div className="space-y-6 text-neutral-800">
            
            {/* Header info card */}
            <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-500">Número do Pedido</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-indigo-950 truncate">{selectedSale.id}</p>
              </div>
            </div>

            {/* Responsive grid for metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Cliente</span>
                <span className="text-neutral-900 font-bold block text-sm">
                  {selectedSale.customer?.name || 'Consumidor Final'}
                </span>
                {selectedSale.customer?.document && (
                  <span className="block text-xs font-mono text-neutral-500 mt-0.5">{selectedSale.customer.document}</span>
                )}
              </div>
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Ocorrência</span>
                <span className="text-neutral-900 font-bold block text-sm">
                  {format(new Date(selectedSale.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="block text-xs text-neutral-500 mt-0.5 font-medium">Operador: {selectedSale.user.name}</span>
              </div>
            </div>

            {/* Responsive item cards list for mobile, compact table on desktop */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 border-b border-neutral-100 pb-2">Itens Comprados</h4>
              
              {/* Desktop version (hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto max-h-56 border border-neutral-100 rounded-xl">
                <table className="min-w-full divide-y divide-neutral-100 text-sm">
                  <thead className="bg-neutral-50/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Produto</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Qtd</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Unitário</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Desconto</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedSale.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-neutral-900">{item.productNameSnapshot}</td>
                        <td className="px-4 py-3 text-right font-mono text-neutral-600 font-semibold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono text-neutral-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono text-rose-500 font-bold">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile version (cards, visible on mobile only) */}
              <div className="block sm:hidden space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="p-3 border border-neutral-100 rounded-xl space-y-2 bg-neutral-50/30">
                    <div className="font-bold text-neutral-900 text-xs">{item.productNameSnapshot}</div>
                    <div className="flex justify-between items-center text-xs text-neutral-500 font-semibold">
                      <span>{item.quantity}x • {formatCurrency(item.unitPrice)}</span>
                      {item.discount > 0 && <span className="text-rose-500">- {formatCurrency(item.discount)}</span>}
                      <span className="font-bold text-neutral-900 font-mono">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments & Totals responsive stack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 border-b border-neutral-100 pb-2">Método de Liquidação</h4>
                <ul className="space-y-2 text-sm font-semibold">
                  {selectedSale.payments.map((p) => (
                    <li key={p.id} className="flex justify-between items-center py-1">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-indigo-500" />
                        {p.method === 'CASH' ? 'Dinheiro' : 
                         p.method === 'CREDIT_CARD' ? 'Cartão de Crédito' : 
                         p.method === 'DEBIT_CARD' ? 'Cartão de Débito' : 
                         p.method === 'PIX' ? 'PIX' : p.method}
                      </span>
                      <span className="text-neutral-900 font-mono font-bold">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-neutral-50/50 p-5 rounded-2xl border border-neutral-200/60 flex flex-col justify-center space-y-2 font-semibold text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Subtotal:</span>
                  <span className="text-neutral-600 font-mono">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Aplicado:</span>
                  <span className="font-mono font-bold">-{formatCurrency(selectedSale.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-black text-neutral-900 border-t pt-2.5 border-neutral-200">
                  <span>Total Final:</span>
                  <span className="font-mono text-indigo-600">{formatCurrency(selectedSale.netAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
export default SalesHistoryPage;
