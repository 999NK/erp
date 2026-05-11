import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Loader2, Calendar, FileText, DollarSign, Users, Tag, Briefcase, RefreshCw, Paperclip } from 'lucide-react';

const receivableSchema = z.object({
  customerId: z.string().optional(),
  description: z.string().min(3, 'Descrição muito curta'),
  categoryId: z.string().optional(),
  costCenterId: z.string().optional(),
  accountId: z.string().min(1, 'Conta financeira é obrigatória para liquidação/recebimento'),
  
  amount: z.number().min(0.01, 'Valor inválido'),
  discountAmount: z.number().min(0),
  interestAmount: z.number().min(0),
  penaltyAmount: z.number().min(0),
  
  dueDate: z.string().min(1, 'Vencimento é obrigatório'),
  accrualDate: z.string().optional(),
  issueDate: z.string().optional(),
  
  notes: z.string().optional(),
  reference: z.string().optional(),

  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.string().optional(),
  recurrenceCount: z.number().optional(),
});

type ReceivableFormValues = z.infer<typeof receivableSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceivableModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [isLiquidating, setIsLiquidating] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ReceivableFormValues>({
    resolver: zodResolver(receivableSchema),
    defaultValues: {
      amount: 0,
      discountAmount: 0,
      interestAmount: 0,
      penaltyAmount: 0,
      isRecurring: false,
    }
  });

  const isRecurring = watch('isRecurring');
  const amount = watch('amount') || 0;
  const intAm = watch('interestAmount') || 0;
  const penAm = watch('penaltyAmount') || 0;
  const discAm = watch('discountAmount') || 0;
  
  const totalAmount = amount + intAm + penAm - discAm;

  // Data Fetching
  const { data: accounts } = useQuery({
    queryKey: ['financial_accounts'],
    queryFn: async () => {
      const res = await fetch('/api/financial/accounts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@ERP:token')}` }
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: isOpen
  });

  const { data: categories } = useQuery({
    queryKey: ['financial_categories', 'INCOME'],
    queryFn: async () => {
      const res = await fetch('/api/financial/categories?type=INCOME', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@ERP:token')}` }
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: isOpen
  });

  const { data: costCenters } = useQuery({
    queryKey: ['cost_centers'],
    queryFn: async () => {
      const res = await fetch('/api/financial/cost-centers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@ERP:token')}` }
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: isOpen
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/people/customers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@ERP:token')}` }
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: isOpen
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ReceivableFormValues & { liquidate?: boolean }) => {
      const token = localStorage.getItem('@ERP:token');
      
      const payload = {
        customerId: data.customerId,
        description: data.description,
        categoryId: data.categoryId,
        costCenterId: data.costCenterId,
        accountId: data.accountId,
        amount: Number(data.amount) || 0,
        discountAmount: Number(data.discountAmount) || 0,
        interestAmount: Number(data.interestAmount) || 0,
        penaltyAmount: Number(data.penaltyAmount) || 0,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        accrualDate: data.accrualDate ? new Date(data.accrualDate).toISOString() : undefined,
        issueDate: data.issueDate ? new Date(data.issueDate).toISOString() : undefined,
        notes: data.notes,
        reference: data.reference,
      };

      // 1. Create Receivable
      const response = await fetch('/api/financial/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erro ao criar receita');
      }
      const created = await response.json();

      // 2. Liquidate if needed
      if (data.liquidate && data.accountId) {
        const receivePayload = {
           receivableId: created.data.id,
           accountId: data.accountId,
           amount: Number(data.amount) || 0,
           discountAmount: Number(data.discountAmount) || 0,
           interestAmount: Number(data.interestAmount) || 0,
           penaltyAmount: Number(data.penaltyAmount) || 0,
        };
        const recRes = await fetch(`/api/financial/receivables/${created.data.id}/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(receivePayload),
        });
        if (!recRes.ok) {
           const err = await recRes.json();
           throw new Error(err.message || 'Criado, mas falhou ao receber.');
        }
      }
      return created;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.liquidate ? 'Receita lançada e recebida com sucesso!' : 'Receita salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['financial_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      reset();
      setIsLiquidating(false);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message);
      setIsLiquidating(false);
    },
  });

  const onSubmit = (data: ReceivableFormValues) => {
     saveMutation.mutate({ ...data, liquidate: isLiquidating });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Lançamento - Contas a Receber" size="5xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-4">
        
        {/* Entidade & Documento */}
        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <Users className="w-5 h-5 text-emerald-600" />
             <h3 className="font-semibold text-gray-800">Entidade e Referência</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select {...register('customerId')} className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="">Selecione um cliente (opcional)</option>
                {customers?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} {c.document ? `- ${c.document}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento / Nota Fiscal</label>
              <input {...register('reference')} type="text" className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Nº NF, contrato ou boleto" />
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Lançamento *</label>
             <input {...register('description')} type="text" className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg" placeholder="Ex: Prestação de Serviços, Venda #123" />
             {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* Classificação Contábil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold">Classificação</h3>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta Financeira (Destino) *</label>
                <select {...register('accountId')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Selecione a conta</option>
                  {accounts?.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.accountId && <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>}
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Contas</label>
                <select {...register('categoryId')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Sem categoria</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
                <select {...register('costCenterId')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Geral</option>
                  {costCenters?.map((cc: any) => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
             </div>
          </div>

          {/* Valores Financeiros */}
          <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 space-y-4 shadow-sm md:col-span-2">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                   <DollarSign className="w-5 h-5 text-emerald-500" />
                   <h3 className="font-semibold">Valores da Receita</h3>
                </div>
                <div className="text-right">
                   <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Total a Receber</span>
                   <span className="text-2xl font-bold font-mono text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
                   </span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Valor Principal (R$) *</label>
                   <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-4 py-3 border-emerald-200 bg-emerald-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xl font-mono text-gray-900" placeholder="0.00" />
                   {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Juros (R$)</label>
                   <input {...register('interestAmount', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Multa (R$)</label>
                   <input {...register('penaltyAmount', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Concedido (R$)</label>
                   <input {...register('discountAmount', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                </div>
             </div>
          </div>
        </div>

        {/* Datas e Observações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Período e Prazos</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento *</label>
                   <input {...register('dueDate')} type="date" className="w-full px-3 py-2 border border-blue-300 bg-blue-50 focus:ring-2 focus:ring-blue-500 rounded-lg" />
                   {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Data Competência</label>
                   <input {...register('accrualDate')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão (Documento)</label>
                   <input {...register('issueDate')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
             </div>
          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Recorrência e Anexos</h3>
               </div>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" {...register('isRecurring')} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                 <span className="text-sm font-medium text-gray-700">Recebimento recorrente</span>
               </label>
             </div>
             
             {isRecurring ? (
               <div className="space-y-4 flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                       <select {...register('recurrenceFrequency')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                         <option value="MONTHLY">Mensal</option>
                         <option value="WEEKLY">Semanal</option>
                         <option value="YEARLY">Anual</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Parcelas</label>
                       <input {...register('recurrenceCount', { valueAsNumber: true })} type="number" min="2" max="120" defaultValue="12" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                    </div>
                 </div>
                 <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                   As demais contas serão geradas automaticamente na mesma data nos meses seguintes pelo worker do sistema.
                 </p>
               </div>
             ) : (
               <div className="flex-1 flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anexar Documento (PDF/XML)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer hover:bg-gray-50 items-center justify-center px-4 py-2 border border-dashed border-gray-400 rounded-lg text-sm text-gray-600 transition-colors w-full bg-gray-50/50">
                        <Paperclip className="w-4 h-4 mr-2 text-gray-400" />
                        Selecione um arquivo...
                        <input type="file" className="hidden" accept=".pdf,.xml,image/*" />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Privadas</label>
                    <textarea {...register('notes')} className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none min-h-[60px]" placeholder="Anotações internas..."></textarea>
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end items-center gap-4">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            Cancelar Operação
          </button>
          
          <div className="flex gap-2">
             <button
               type="submit"
               onClick={() => setIsLiquidating(false)}
               disabled={saveMutation.isPending}
               className="px-6 py-2.5 flex items-center gap-2 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-50"
             >
               {saveMutation.isPending && !isLiquidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
               Salvar Previsão (Pendente)
             </button>
             
             <button
               type="submit"
               onClick={() => setIsLiquidating(true)}
               disabled={saveMutation.isPending}
               className="px-6 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 shadow-emerald-600/20"
             >
               {saveMutation.isPending && isLiquidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
               Salvar e Receber Agora
             </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
