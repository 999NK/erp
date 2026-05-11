import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface NewDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewDemandModal({ isOpen, onClose, onSuccess }: NewDemandModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklist, setNewChecklist] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset state
      setTitle('');
      setDescription('');
      setAssignedToUserId('');
      setPriority('MEDIUM');
      setDueDate('');
      setChecklistItems([]);
      setNewChecklist('');
      setError('');
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error('Erro ao buscar usuários:', e);
    }
  };

  const handleAddChecklist = () => {
    if (newChecklist.trim()) {
      setChecklistItems([...checklistItems, newChecklist.trim()]);
      setNewChecklist('');
    }
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedToUserId || !priority) {
      setError('Por favor, preencha todos os campos obrigatórios (Título, Responsável e Prioridade).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('@ERP:token');
      
      const payload: any = {
        title,
        description,
        assignedToUserId,
        priority,
        status: 'PENDING',
        checklistItems
      };

      if (dueDate) {
        payload.dueDate = new Date(dueDate).toISOString();
      }

      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Erro ao criar demanda');
      }
    } catch (err: any) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-lg font-bold text-neutral-900">Nova Demanda Operacional</h2>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form id="new-demand-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Título da Tarefa *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Auditoria de estoque da vitrine"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm text-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Descrição</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais sobre a tarefa..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm text-neutral-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    Responsável *
                  </label>
                  <select 
                    value={assignedToUserId}
                    onChange={(e) => setAssignedToUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm text-neutral-900 appearance-none"
                    required
                  >
                    <option value="">Selecione o responsável</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Prioridade *</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm text-neutral-900 appearance-none"
                    required
                  >
                    <option value="LOW">🟢 Baixa</option>
                    <option value="MEDIUM">🔵 Média</option>
                    <option value="HIGH">🟠 Alta</option>
                    <option value="URGENT">🔴 Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    Data Limite (Opcional)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm text-neutral-900"
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Checklist Operacional</label>
                <div className="space-y-2 mb-3">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
                      <div className="w-4 h-4 rounded border border-neutral-300"></div>
                      <span className="text-sm text-neutral-700 flex-1">{item}</span>
                      <button type="button" onClick={() => handleRemoveChecklist(index)} className="text-neutral-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newChecklist}
                    onChange={(e) => setNewChecklist(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklist(); } }}
                    placeholder="Novo item do checklist... (Pressione Enter)"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button type="button" onClick={handleAddChecklist} className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-sm font-semibold transition">
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Anexos */}
              <div className="pt-4 border-t border-neutral-100">
                 <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-neutral-300 text-neutral-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl text-sm font-semibold transition" onClick={() => alert('Anexos estarão disponíveis após a criação da demanda na aba de Visualização.')}>
                   📎 Anexar Arquivos (Disponível após criar)
                 </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button 
              form="new-demand-form"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 rounded-xl transition shadow-sm flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Criando...' : 'Criar Demanda'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
