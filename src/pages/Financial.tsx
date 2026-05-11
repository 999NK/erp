import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { motion } from 'motion/react';
import { MainLayout } from '../components/layout/MainLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { ReceivableModal } from '../components/financial/ReceivableModal';
import { PayableModal } from '../components/financial/PayableModal';
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

export function FinancialPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'payables' | 'transactions'>('overview');
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const { canCreate } = usePermissions();

  const fetchWithToken = async (url: string) => {
    const token = localStorage.getItem('@ERP:token');
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
    if (!res.ok) throw new Error(`Falha ao buscar ${url}`);
    const json = await res.json();
    return json.data;
  };

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial_dashboard', 'summary'],
    queryFn: () => fetchWithToken('/api/financial/dashboard/summary')
  });

  const chartData = summary?.flowChart || [];

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['financial_dashboard', 'transactions', activeTab],
    queryFn: () => fetchWithToken(`/api/financial/transactions?limit=${activeTab === 'transactions' ? 100 : 20}`)
  });

  const { data: receivables = [], isLoading: loadingRec } = useQuery({
    queryKey: ['receivables'],
    queryFn: () => fetchWithToken('/api/financial/receivables')
  });

  const { data: payables = [], isLoading: loadingPay } = useQuery({
    queryKey: ['payables'],
    queryFn: () => fetchWithToken('/api/financial/payables')
  });

  if (loadingSummary || loadingTx || loadingRec || loadingPay) {
     return (
       <MainLayout>
         <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           <p className="text-neutral-500 text-sm font-semibold">Sincronizando dados com o livro caixa...</p>
         </div>
       </MainLayout>
     );
  }

  // 1. Receivables Table columns
  const receivableColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => <span className="font-mono text-xs">{new Date(row.original.dueDate).toLocaleDateString('pt-BR')}</span>
    },
    {
      accessorKey: 'description',
      header: 'Cliente / Descrição',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-bold text-neutral-900 truncate">{row.original.description}</div>
          <div className="text-[11px] text-neutral-400 font-medium truncate">{row.original.customer?.name || 'Cliente Avulso'}</div>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Valor Total',
      cell: ({ row }) => <span className="font-mono font-bold text-neutral-900">{formatCurrency(row.original.amount)}</span>
    },
    {
      accessorKey: 'receivedAmount',
      header: 'Recebido',
      cell: ({ row }) => <span className="font-mono text-neutral-500">{formatCurrency(row.original.receivedAmount)}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            status === 'RECEIVED' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status === 'RECEIVED' ? 'Recebido' : status === 'PENDING' ? 'Pendente' : 'Atrasado'}
          </span>
        );
      }
    },
    {
      accessorKey: 'actions',
      header: 'Ação',
      cell: ({ row }) => {
        const r = row.original;
        return r.status !== 'RECEIVED' ? (
          <button className="text-[11px] font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all cursor-pointer">
            Receber
          </button>
        ) : (
          <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Liquidado</span>
        );
      }
    }
  ];

  // 2. Payables Table columns
  const payableColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => <span className="font-mono text-xs">{new Date(row.original.dueDate).toLocaleDateString('pt-BR')}</span>
    },
    {
      accessorKey: 'description',
      header: 'Fornecedor / Descrição',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-bold text-neutral-900 truncate">{row.original.description}</div>
          <div className="text-[11px] text-neutral-400 font-medium truncate">{row.original.supplier?.name || 'Vários'}</div>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Valor Total',
      cell: ({ row }) => <span className="font-mono font-bold text-neutral-900">{formatCurrency(row.original.amount)}</span>
    },
    {
      accessorKey: 'paidAmount',
      header: 'Pago',
      cell: ({ row }) => <span className="font-mono text-neutral-500">{formatCurrency(row.original.paidAmount)}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            status === 'PAID' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status === 'PAID' ? 'Pago' : status === 'PENDING' ? 'Pendente' : 'Atrasado'}
          </span>
        );
      }
    },
    {
      accessorKey: 'actions',
      header: 'Ação',
      cell: ({ row }) => {
        const p = row.original;
        return p.status !== 'PAID' ? (
          <button className="text-[11px] font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer">
            Pagar
          </button>
        ) : (
          <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pago</span>
        );
      }
    }
  ];

  // 3. Transactions Table columns
  const transactionColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Data / Hora',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-neutral-400 font-semibold">
          {new Date(row.original.createdAt).toLocaleString('pt-BR')}
        </span>
      )
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="font-bold text-neutral-900 flex items-center gap-2 min-w-0">
            {tx.type === 'INCOME' ? (
              <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500 flex-shrink-0" />
            )}
            <span className="truncate">{tx.description}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => <span className="text-neutral-500 font-semibold text-xs">{row.original.category?.name || 'Geral'}</span>
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => (
        <span className={`font-mono font-bold ${row.original.type === 'INCOME' ? 'text-emerald-600' : 'text-neutral-800'}`}>
          {row.original.type === 'INCOME' ? '+' : '-'}{formatCurrency(row.original.amount)}
        </span>
      )
    },
    {
      accessorKey: 'account',
      header: 'Conta',
      cell: ({ row }) => <span className="text-neutral-400 font-bold text-xs">{row.original.account?.name || 'Caixa'}</span>
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Fluxo Financeiro</h1>
            <p className="text-sm text-neutral-500">Contas a pagar, a receber, fluxo de caixa e conciliação bancária.</p>
          </div>
        </div>

        {/* Custom Tabs with wrapping layout to prevent mobile overflow */}
        <div className="flex flex-wrap gap-1.5 bg-neutral-100 p-1 rounded-2xl w-full sm:w-max">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex-1 sm:flex-initial text-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('receivables')} 
            className={`flex-1 sm:flex-initial text-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'receivables' 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Contas a Receber
          </button>
          <button 
            onClick={() => setActiveTab('payables')} 
            className={`flex-1 sm:flex-initial text-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'payables' 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Contas a Pagar
          </button>
          <button 
            onClick={() => setActiveTab('transactions')} 
            className={`flex-1 sm:flex-initial text-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'transactions' 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Ledger / Extrato
          </button>
        </div>

        {/* Tab content rendering */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* KPI Metrics section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0"><Wallet className="w-5.5 h-5.5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 font-semibold mb-0.5 truncate">Saldo em Caixa</p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-neutral-900 truncate">{formatCurrency(summary?.cashBalance || 0)}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5.5 h-5.5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 font-semibold mb-0.5 truncate">Receita Total</p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-neutral-900 truncate">{formatCurrency(summary?.totalRevenue || 0)}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0"><TrendingDown className="w-5.5 h-5.5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 font-semibold mb-0.5 truncate">Despesas Totais</p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-neutral-900 truncate">{formatCurrency(summary?.totalExpenses || 0)}</h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200/60 flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0"><Activity className="w-5.5 h-5.5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 font-semibold mb-0.5 truncate">Lucro Líquido</p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-neutral-900 truncate">{formatCurrency(summary?.netIncome || 0)}</h3>
                </div>
              </div>
            </div>

            {/* Cash Flow Charts and ledger preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6 min-w-0">
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-neutral-200/60">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-6 tracking-tight">Fluxo de Caixa (7 Dias)</h2>
                  <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <RechartsTooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-neutral-200/60 flex flex-col h-full min-w-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Transações Recentes</h2>
                  <button onClick={() => setActiveTab('transactions')} className="text-xs text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer">Ver Todas</button>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-[400px] space-y-3 pr-1">
                  {transactions.length === 0 ? (
                    <div className="text-center text-neutral-400 py-12 text-xs">Nenhuma transação registrada.</div>
                  ) : (
                    transactions.slice(0, 6).map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-neutral-50/50 rounded-xl transition-all border border-neutral-100 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                            <DollarSign className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-neutral-900 truncate">{tx.description}</p>
                            <p className="text-[10px] text-neutral-400 font-medium truncate">{tx.account?.name}</p>
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-xs flex-shrink-0 ml-2 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-neutral-800'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'receivables' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
             <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Contas a Receber</h2>
                  <p className="text-xs text-neutral-400 font-medium">Acompanhe recebíveis de faturamento e ordens pendentes.</p>
                </div>
                {canCreate('financial') && (
                <button 
                  onClick={() => setIsReceivableModalOpen(true)}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-50 cursor-pointer"
                >
                  Registrar Recebimento
                </button>
                )}
             </div>
             <div className="p-4 sm:p-6">
                <DataTable columns={receivableColumns} data={receivables} />
             </div>
          </motion.div>
        )}

        {activeTab === 'payables' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
             <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Contas a Pagar</h2>
                  <p className="text-xs text-neutral-400 font-medium">Controle compromissos fiscais, folha e fornecedores.</p>
                </div>
                {canCreate('financial') && (
                <button 
                  onClick={() => setIsPayableModalOpen(true)}
                  className="w-full sm:w-auto bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-50 cursor-pointer"
                >
                  Registrar Despesa
                </button>
                )}
             </div>
             <div className="p-4 sm:p-6">
                <DataTable columns={payableColumns} data={payables} />
             </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden">
             <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Extrato Financeiro Completo</h2>
                  <p className="text-xs text-neutral-400 font-medium">Auditoria completa de todos os lançamentos e contas integradas.</p>
                </div>
                <div>
                  <button className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 cursor-pointer">Exportar Lançamentos (.CSV)</button>
                </div>
             </div>
             <div className="p-4 sm:p-6">
                <DataTable columns={transactionColumns} data={transactions} />
             </div>
          </motion.div>
        )}
      </div>

      <ReceivableModal 
        isOpen={isReceivableModalOpen} 
        onClose={() => setIsReceivableModalOpen(false)} 
      />
      
      <PayableModal 
        isOpen={isPayableModalOpen} 
        onClose={() => setIsPayableModalOpen(false)} 
      />
    </MainLayout>
  );
}
