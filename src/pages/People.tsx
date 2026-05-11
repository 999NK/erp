import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Users, UserPlus, Search, Download, Filter, Edit, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { CustomerModal } from '../components/people/CustomerModal';
import { SupplierModal } from '../components/people/SupplierModal';
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

export function PeoplePage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { canCreate, canExport } = usePermissions();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('@ERP:token');
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter) queryParams.append('status', statusFilter);

      const [custRes, supRes] = await Promise.all([
        fetch(`/api/people/customers?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/people/suppliers?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const custJson = await custRes.json();
      const supJson = await supRes.json();
      
      if (custJson.success) setCustomers(custJson.data);
      if (supJson.success) setSuppliers(supJson.data);
      setCurrentPage(1); // reset to first page on new fetch
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [activeTab, searchTerm, statusFilter]);

  const currentList = activeTab === 'customers' ? customers : suppliers;
  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = async () => {
    const token = localStorage.getItem('@ERP:token');
    try {
      await fetch('/api/reporting/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: activeTab === 'customers' ? 'CUSTOMERS' : 'SUPPLIERS', format: 'CSV' })
      });
      alert('Exportação solicitada! Verifique em Relatórios.');
    } catch {
      alert('Erro ao solicitar exportação.');
    }
  };

  // Customers (Clientes) column definitions
  const customerColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex justify-center items-center font-bold text-sm shadow-sm flex-shrink-0 border border-indigo-100">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-neutral-900 truncate">{row.original.name}</div>
            <div className="text-[10px] text-neutral-400 font-mono tracking-tight mt-0.5 truncate">{row.original.document || 'Sem Documento'}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'contact',
      header: 'Contato',
      cell: ({ row }) => (
        <div className="min-w-0 font-medium text-xs">
          <div className="text-neutral-700 font-semibold">{row.original.mobilePhone || row.original.phone || '-'}</div>
          <div className="text-neutral-400 mt-0.5 truncate">{row.original.email || '-'}</div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status / Tags',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${row.original.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-neutral-50 text-neutral-500 border border-neutral-200'}`}>
            {row.original.isActive ? 'Ativo' : 'Inativo'}
          </span>
          {row.original.tags && (
            <span className="text-[9px] text-neutral-400 font-bold border border-neutral-200 px-1.5 py-0.5 rounded-lg truncate max-w-[120px]" title={row.original.tags}>
              {row.original.tags.split(',')[0]}
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'credit',
      header: 'Saúde de Crédito',
      cell: ({ row }) => {
        const item = row.original;
        if (!item.credit) return <span className="text-xs text-neutral-400 font-bold italic">Sem análise</span>;
        const total = item.credit.creditLimit || 0;
        const used = item.credit.usedCredit || 0;
        const isNearLimit = total > 0 && used > total * 0.8;
        return (
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-neutral-400">Limite:</span>
              <span className="font-mono text-neutral-800">R$ {total.toFixed(2)}</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
               <div className={`h-full ${isNearLimit ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${total ? Math.min((used / total) * 100, 100) : 0}%` }}></div>
            </div>
            <div className={`text-[9px] font-bold ${isNearLimit ? 'text-rose-600' : 'text-emerald-600'}`}>
               Disp: R$ {(total - used).toFixed(2)}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'actions',
      header: 'Ações Rápidas',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100" title="Editar Contato">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100" title="Histórico de Compras">
            <Activity className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-100" title="Gerar Cobrança">
            <DollarSignIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Suppliers (Fornecedores) column definitions
  const supplierColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Fornecedor',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex justify-center items-center font-bold text-sm shadow-sm flex-shrink-0 border border-orange-100">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-neutral-900 truncate">{row.original.name}</div>
            <div className="text-[10px] text-neutral-400 font-mono tracking-tight mt-0.5 truncate">{row.original.document || 'Sem Documento'}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'contact',
      header: 'Contato',
      cell: ({ row }) => (
        <div className="min-w-0 font-medium text-xs">
          <div className="text-neutral-700 font-semibold">{row.original.mobilePhone || row.original.phone || '-'}</div>
          <div className="text-neutral-400 mt-0.5 truncate">{row.original.email || '-'}</div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status / Tags',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${row.original.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-neutral-50 text-neutral-500 border border-neutral-200'}`}>
            {row.original.isActive ? 'Ativo' : 'Inativo'}
          </span>
          {row.original.tags && (
            <span className="text-[9px] text-neutral-400 font-bold border border-neutral-200 px-1.5 py-0.5 rounded-lg truncate max-w-[120px]" title={row.original.tags}>
              {row.original.tags.split(',')[0]}
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="inline-flex px-2 py-0.5 bg-neutral-100 rounded-lg text-neutral-600 text-xs font-bold border border-neutral-200">
          {row.original.category ? row.original.category.toUpperCase() : 'GERAL'}
        </span>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Ações Rápidas',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100" title="Editar Contato">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100" title="Histórico de Pedidos">
            <Activity className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Responsive Header Block */}
        <div className="flex justify-between items-start lg:items-center flex-col lg:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Gestão de Pessoas (CRM)</h1>
            <p className="text-sm text-neutral-500 mt-1">Administração de clientes, controle de crédito e gestão de fornecedores.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {canExport('reports') && (
            <button onClick={handleExport} className="w-full sm:w-auto bg-white border border-neutral-200 text-neutral-600 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors cursor-pointer">
              <Download className="w-4 h-4" /> Exportar Contatos
            </button>
            )}
            {canCreate('customers') && (
            <button 
              onClick={() => activeTab === 'customers' ? setIsCustomerModalOpen(true) : setIsSupplierModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar {activeTab === 'customers' ? 'Cliente' : 'Fornecedor'}
            </button>
            )}
          </div>
        </div>

        {/* Tabs and Filters Stack (Responsive auto-wrapping) */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200/60 flex flex-col lg:flex-row justify-between gap-4">
           
           <div className="flex flex-wrap gap-1.5 bg-neutral-100 p-1 rounded-2xl w-full lg:w-max">
             <button onClick={() => setActiveTab('customers')} className={`flex-1 lg:flex-none text-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'customers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Clientes</button>
             <button onClick={() => setActiveTab('suppliers')} className={`flex-1 lg:flex-none text-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'suppliers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Fornecedores</button>
           </div>
           
           <div className="flex flex-col sm:flex-row flex-1 gap-3 lg:justify-end">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Busca por nome, doc ou email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:border-indigo-500 bg-neutral-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 font-semibold"
                />
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-neutral-200 focus:border-indigo-500 bg-white focus:ring-4 focus:ring-indigo-100 font-bold text-neutral-600 cursor-pointer"
                >
                  <option value="">Todos os Status</option>
                  <option value="active">Apenas Ativos</option>
                  <option value="inactive">Apenas Inativos</option>
                </select>
              </div>
           </div>
        </div>

        {/* Data Table Wrapper (DataTable handles card styling on mobile seamlessly) */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-4 sm:p-6 overflow-hidden relative">
          {loading && <div className="absolute top-0 left-0 w-full h-1 bg-neutral-100 overflow-hidden"><div className="h-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite] w-1/3"></div></div>}
          
          <DataTable 
            columns={activeTab === 'customers' ? customerColumns : supplierColumns} 
            data={paginatedList} 
          />

          {/* Pagination Footer cards */}
          {totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-neutral-400 font-semibold">Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, currentList.length)} de {currentList.length} registros</span>
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition ${currentPage === idx + 1 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm' : 'bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => { setIsCustomerModalOpen(false); fetchData(); }} />
      <SupplierModal isOpen={isSupplierModalOpen} onClose={() => { setIsSupplierModalOpen(false); fetchData(); }} />
    </MainLayout>
  );
}

function DollarSignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
export default PeoplePage;
