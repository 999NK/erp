import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { FileText, Download, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

export function ReportsPage() {
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExports = async () => {
    const token = localStorage.getItem('@ERP:token');
    try {
      const res = await fetch('/api/reporting/exports', { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setExports(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
    const interval = setInterval(() => {
       fetchExports();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestExport = async (type: string, format: string) => {
    const token = localStorage.getItem('@ERP:token');
    try {
      await fetch('/api/reporting/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, format })
      });
      fetchExports();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'QUEUED': return <span className="inline-flex px-2.5 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10px] rounded-full font-bold">NA FILA</span>;
      case 'PROCESSING': return <span className="inline-flex px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] rounded-full font-bold animate-pulse">PROCESSANDO</span>;
      case 'COMPLETED': return <span className="inline-flex px-2.5 py-0.5 bg-green-50 text-green-600 border border-green-200 text-[10px] rounded-full font-bold">CONCLUÍDO</span>;
      case 'FAILED': return <span className="inline-flex px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] rounded-full font-bold">FALHA</span>;
      case 'EXPIRED': return <span className="inline-flex px-2.5 py-0.5 bg-neutral-50 text-neutral-400 border border-neutral-200 text-[10px] rounded-full font-bold">EXPIRADO</span>;
      default: return <span className="inline-flex px-2.5 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10px] rounded-full font-bold">{status}</span>;
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'type',
      header: 'Arquivo',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div className="min-w-0 text-left">
             <div className="font-bold text-neutral-900">{exp.type} - {exp.format}</div>
             <div className="text-[11px] text-neutral-400 font-semibold mt-0.5">{new Date(exp.createdAt).toLocaleString('pt-BR')} {exp.fileSize ? `• ${(exp.fileSize / 1024).toFixed(1)} KB` : ''}</div>
             {exp.errorMessage && <div className="text-[10px] text-red-500 flex gap-1 mt-1 items-center font-bold"><AlertCircle className="w-3 h-3"/>{exp.errorMessage}</div>}
          </div>
        );
      }
    },
    {
      accessorKey: 'format',
      header: 'Tipo / Formato',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div className="flex gap-1.5">
             <span className="font-mono text-[10px] font-bold bg-neutral-100 px-2.5 py-0.5 rounded-full text-neutral-600 border border-neutral-200">{exp.type.split('_')[0]}</span>
             <span className="font-mono text-[10px] font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full text-indigo-600 border border-indigo-200">{exp.format}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      accessorKey: 'actions',
      header: 'Download',
      cell: ({ row }) => {
        const exp = row.original;
        return exp.status === 'COMPLETED' && exp.downloadUrl ? (
          <a href={exp.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-end gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-all cursor-pointer">
             <Download className="w-4 h-4" /> Baixar Arquivo
          </a>
        ) : null;
      }
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header Title Block */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Centro de Relatórios Enterprise</h1>
          <p className="text-sm text-neutral-500 mt-1">Geração assíncrona de relatórios analíticos, valuation e fechamento fiscal em background.</p>
        </div>

        {/* Dynamic Card Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
           <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200/60 flex flex-col items-center text-center gap-4 hover:shadow-md transition duration-200">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100"><FileText className="w-8 h-8" /></div>
              <div>
                 <h3 className="text-base sm:text-lg font-bold text-neutral-900">Relatório Financeiro</h3>
                 <p className="text-xs text-neutral-400 font-semibold mt-1 mb-5">DRE consolidado, fluxo de caixa e conciliação de faturamento.</p>
                 <div className="flex gap-2 justify-center">
                    <button onClick={() => handleRequestExport('FINANCIAL_LEDGER', 'PDF')} className="text-xs font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer">Gerar PDF</button>
                    <button onClick={() => handleRequestExport('FINANCIAL_LEDGER', 'XLSX')} className="text-xs font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer">Exportar Excel</button>
                 </div>
              </div>
           </motion.div>

           <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200/60 flex flex-col items-center text-center gap-4 hover:shadow-md transition duration-200">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100"><FileSpreadsheet className="w-8 h-8" /></div>
              <div>
                 <h3 className="text-base sm:text-lg font-bold text-neutral-900">Relatório Comercial</h3>
                 <p className="text-xs text-neutral-400 font-semibold mt-1 mb-5">Histórico de vendas por vendedor, ticket médio e curvas de conversão.</p>
                 <div className="flex gap-2 justify-center">
                    <button onClick={() => handleRequestExport('COMMERCIAL_SALES', 'PDF')} className="text-xs font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer">Gerar PDF</button>
                    <button onClick={() => handleRequestExport('COMMERCIAL_SALES', 'XLSX')} className="text-xs font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer">Exportar Excel</button>
                 </div>
              </div>
           </motion.div>

           <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200/60 flex flex-col items-center text-center gap-4 hover:shadow-md transition duration-200">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100"><FileText className="w-8 h-8" /></div>
              <div>
                 <h3 className="text-base sm:text-lg font-bold text-neutral-900">Relatório de Estoque</h3>
                 <p className="text-xs text-neutral-400 font-semibold mt-1 mb-5">Valuation de inventário, produtos críticos e giro de mercadorias.</p>
                 <div className="flex gap-2 justify-center">
                    <button onClick={() => handleRequestExport('INVENTORY_VALUATION', 'PDF')} className="text-xs font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer">Gerar PDF</button>
                    <button onClick={() => handleRequestExport('INVENTORY_VALUATION', 'XLSX')} className="text-xs font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer">Exportar Excel</button>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* Fila de background list block */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 p-4 sm:p-6 relative">
          {loading && <div className="absolute top-0 left-0 w-full h-1 bg-neutral-100 overflow-hidden"><div className="h-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite] w-1/3"></div></div>}
          
          <div className="flex justify-between items-center mb-6">
             <div>
               <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">Exportações Realizadas</h2>
               <p className="text-xs text-neutral-400 font-medium mt-0.5">Fila de processamento assíncrono em background.</p>
             </div>
             <button onClick={fetchExports} className="text-indigo-600 hover:text-indigo-700 flex gap-2 items-center text-xs font-bold transition cursor-pointer"><RefreshCw className="w-4 h-4" /> Atualizar agora</button>
          </div>

          <DataTable columns={columns} data={exports} />
        </div>
      </div>
    </MainLayout>
  );
}
export default ReportsPage;
