import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { motion } from 'motion/react';
import { CheckSquare, Plus, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { NewDemandModal } from '../components/tasks/NewDemandModal';
import { ViewDemandModal } from '../components/tasks/ViewDemandModal';
import { usePermissions } from '../hooks/usePermissions';
import { useDebounce } from '../hooks/useUtils';
import { EmptyState, SkeletonCards } from '../components/ui/EmptyState';

export function Demands() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { canCreate, user } = usePermissions();
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch('/api/demands', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !debouncedSearch || 
      task.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      task.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAITING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Pendente';
      case 'IN_PROGRESS': return 'Em Progresso';
      case 'WAITING': return 'Aguardando';
      case 'COMPLETED': return 'Concluída';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'text-neutral-500 bg-neutral-100';
      case 'MEDIUM': return 'text-blue-500 bg-blue-100';
      case 'HIGH': return 'text-orange-500 bg-orange-100';
      case 'URGENT': return 'text-red-500 bg-red-100';
      default: return 'text-neutral-500 bg-neutral-100';
    }
  };

  const getPriorityLabel = (p: string) => {
    switch(p) {
      case 'LOW': return 'Baixa';
      case 'MEDIUM': return 'Média';
      case 'HIGH': return 'Alta';
      case 'URGENT': return 'Urgente';
      default: return p;
    }
  };

  // KPI counts
  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight font-sans flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            Demandas Operacionais
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Gestão de tarefas e operações internas da equipe</p>
        </div>

        {canCreate('demands') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Demanda
          </button>
        )}
      </div>

      {/* KPI Mini Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-yellow-50 border border-yellow-200/60 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 mb-0.5">Pendente</p>
          <p className="text-xl font-black font-mono text-yellow-700">{pending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">Em Progresso</p>
          <p className="text-xl font-black font-mono text-blue-700">{inProgress}</p>
        </div>
        <div className="bg-green-50 border border-green-200/60 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-0.5">Concluídas</p>
          <p className="text-xl font-black font-mono text-green-700">{completed}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Buscar demandas..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">Pendente</option>
          <option value="IN_PROGRESS">Em Progresso</option>
          <option value="WAITING">Aguardando</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState 
          icon={CheckSquare} 
          title="Nenhuma demanda encontrada" 
          description={tasks.length === 0 ? "Sua lista de tarefas operacionais está vazia." : "Nenhuma demanda corresponde ao filtro selecionado."}
          action={canCreate('demands') ? { label: 'Nova Demanda', onClick: () => setIsModalOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map((task, i) => (
            <motion.div 
              key={task.id} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedTaskId(task.id)}
              className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition cursor-pointer flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${getStatusColor(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1 group-hover:text-indigo-700 transition-colors truncate">{task.title}</h3>
              <p className="text-xs text-neutral-500 line-clamp-2 mb-4 flex-1">{task.description || 'Sem descrição.'}</p>
              
              <div className="mt-auto pt-4 border-t border-neutral-100 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy') : 'Sem prazo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {task.assignedToUser ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold flex-shrink-0" title={task.assignedToUser.name}>
                      {task.assignedToUser.name.charAt(0)}
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-100 px-2 py-0.5 rounded-md">N/A</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <NewDemandModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTasks} 
      />

      <ViewDemandModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchTasks}
      />
    </MainLayout>
  );
}
