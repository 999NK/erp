import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Clock, MessageSquare, CheckCircle, Play, AlertCircle, Loader2, StopCircle, Paperclip, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ViewDemandModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ViewDemandModal({ taskId, isOpen, onClose, onUpdate }: ViewDemandModalProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
      setError('');
      setCommentText('');
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/demands/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTask(data.data);
      } else {
        setError(data.message || 'Erro ao carregar demanda');
      }
    } catch (e) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/demands/${taskId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
        fetchTaskDetails(); // reload timeline
      } else {
        setError(data.message || 'Erro ao mudar status');
      }
    } catch (e) {
      setError('Erro de conexão ao mudar status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/demands/${taskId}/comments`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });
      const data = await res.json();
      if (data.success) {
        setCommentText('');
        fetchTaskDetails(); // reload timeline
      } else {
        setError(data.message || 'Erro ao adicionar comentário');
      }
    } catch (e) {
      setError('Erro de conexão ao comentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).checklistInput;
    if (!input.value.trim()) return;

    try {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/demands/${taskId}/checklist`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: input.value })
      });
      if (res.ok) {
        input.value = '';
        fetchTaskDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (itemId: string, completed: boolean) => {
    try {
      const token = localStorage.getItem('@ERP:token');
      await fetch(`/api/demands/${taskId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed })
      });
      fetchTaskDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const token = localStorage.getItem('@ERP:token');

        const response = await fetch(`/api/demands/${taskId}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: base64String,
            fileSize: file.size,
            mimeType: file.type
          })
        });

        if (response.ok) {
          fetchTaskDetails();
        } else {
          alert('Erro ao enviar anexo');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar arquivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-lg text-xs font-bold uppercase">Pendente</span>;
      case 'IN_PROGRESS': return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-lg text-xs font-bold uppercase">Em Andamento</span>;
      case 'WAITING': return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 rounded-lg text-xs font-bold uppercase">Aguardando Terceiros</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-lg text-xs font-bold uppercase">Concluído</span>;
      case 'CANCELLED': return <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-3 py-1 rounded-lg text-xs font-bold uppercase">Cancelado</span>;
      default: return <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-3 py-1 rounded-lg text-xs font-bold uppercase">{status}</span>;
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
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
        >
          {loading && !task ? (
            <div className="p-12 flex flex-col items-center justify-center w-full min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p className="text-neutral-500 font-medium">Carregando detalhes...</p>
            </div>
          ) : !task ? (
            <div className="p-12 flex flex-col items-center justify-center w-full min-h-[400px]">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-neutral-800 font-bold text-lg mb-2">Erro ao carregar</p>
              <p className="text-neutral-500 text-sm mb-6">{error || 'Não foi possível encontrar a demanda.'}</p>
              <button onClick={onClose} className="px-6 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-bold transition">Fechar</button>
            </div>
          ) : (
            <>
              {/* Esquerda: Detalhes da Task (60%) */}
              <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-100 overflow-y-auto">
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    {getStatusBadge(task.status)}
                    <span className="text-xs font-bold text-neutral-400">ID: {task.id.substring(0,8)}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4 leading-tight">{task.title}</h2>
                  
                  <div className="prose prose-sm text-neutral-600 mb-8 whitespace-pre-wrap">
                    {task.description || <span className="italic text-neutral-400">Nenhuma descrição fornecida.</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-5 rounded-2xl border border-neutral-100 mb-8">
                    <div>
                      <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Responsável</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
                          {task.assignedToUser ? task.assignedToUser.name.charAt(0) : '?'}
                        </div>
                        <span className="text-sm font-semibold text-neutral-800">
                          {task.assignedToUser ? task.assignedToUser.name : 'Não atribuído'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Criado por</span>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-semibold text-neutral-800">{task.createdByUser?.name}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Prazo</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-semibold text-neutral-800">
                          {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy 'às' HH:mm") : 'Sem prazo'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Criação</span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-semibold text-neutral-800">
                          {format(new Date(task.createdAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="mb-8">
                    <span className="block text-sm font-bold text-neutral-900 mb-3">Checklist Operacional</span>
                    <div className="space-y-2 mb-3">
                      {task.checklist?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={item.completed}
                            onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className={`text-sm ${item.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                      {task.checklist?.length === 0 && (
                        <p className="text-xs text-neutral-500 italic">Nenhum item adicionado ao checklist.</p>
                      )}
                    </div>
                    <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                      <input 
                        type="text" 
                        name="checklistInput"
                        placeholder="Novo item do checklist..."
                        className="flex-1 px-3 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button type="submit" className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg transition">
                        Adicionar
                      </button>
                    </form>
                  </div>

                  {/* Anexos e Arquivos Reais */}
                  <div className="mb-8 pt-6 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="block text-sm font-bold text-neutral-900">Anexos e Arquivos</span>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        {uploadingFile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                        <span>{uploadingFile ? 'Enviando...' : 'Anexar Arquivo'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                    </div>
                    <div className="space-y-2">
                      {task.attachments?.map((att: any) => (
                        <div key={att.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Paperclip className="w-4 h-4 text-neutral-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-800 truncate">{att.fileName}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">{(att.fileSize / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <a 
                            href={att.fileUrl} 
                            download={att.fileName}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 rounded-lg transition shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                      {task.attachments?.length === 0 && (
                        <p className="text-xs text-neutral-500 italic">Nenhum anexo associado a esta demanda.</p>
                      )}
                    </div>
                  </div>

                  {/* Ações de Status */}
                  <div className="mb-4">
                    <span className="block text-sm font-bold text-neutral-900 mb-3">Mudar Status</span>
                    <div className="flex flex-wrap gap-3">
                      {task.status !== 'IN_PROGRESS' && (
                        <button 
                          disabled={changingStatus}
                          onClick={() => handleStatusChange('IN_PROGRESS')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-bold transition"
                        >
                          <Play className="w-4 h-4" /> Iniciar Tarefa
                        </button>
                      )}
                      
                      {task.status !== 'PENDING' && task.status !== 'COMPLETED' && (
                        <button 
                          disabled={changingStatus}
                          onClick={() => handleStatusChange('WAITING')}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-xl text-sm font-bold transition"
                        >
                          <StopCircle className="w-4 h-4" /> Pausar / Aguardando
                        </button>
                      )}

                      {task.status !== 'COMPLETED' && (
                        <button 
                          disabled={changingStatus}
                          onClick={() => handleStatusChange('COMPLETED')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 shadow-sm rounded-xl text-sm font-bold transition ml-auto"
                        >
                          <CheckCircle className="w-4 h-4" /> Concluir Tarefa
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Direita: Timeline e Comentários (40%) */}
              <div className="w-full md:w-96 flex flex-col bg-neutral-50 h-[300px] md:h-auto">
                <div className="p-4 border-b border-neutral-200 bg-white flex justify-between items-center">
                  <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Atividades
                  </h3>
                  <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Scroll Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {task.activities?.map((act: any) => (
                    <div key={act.id} className="flex gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-bold">
                        {act.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-sm border border-neutral-200 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-neutral-800">{act.user?.name}</span>
                          <span className="text-[10px] text-neutral-400">{format(new Date(act.createdAt), "dd/MM 'às' HH:mm")}</span>
                        </div>
                        <p className="text-sm text-neutral-600">
                          {act.type === 'STATUS_CHANGE' ? (
                            <span className="font-semibold text-indigo-600">{act.content}</span>
                          ) : (
                            act.content
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  {task.activities?.length === 0 && (
                    <p className="text-center text-xs text-neutral-400 py-4">Nenhuma atividade registrada.</p>
                  )}
                </div>

                {/* Input de Comentário */}
                <form onSubmit={handleAddComment} className="p-4 bg-white border-t border-neutral-200">
                  <div className="relative">
                    <textarea 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Adicionar um comentário..."
                      rows={2}
                      className="w-full px-4 py-2.5 pr-12 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition text-sm text-neutral-900 resize-none"
                    />
                    <button 
                      type="submit" 
                      disabled={submittingComment || !commentText.trim()}
                      className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
