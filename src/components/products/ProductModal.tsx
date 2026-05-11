import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Loader2, Box, DollarSign, Tag, FileText, Settings, RefreshCw } from 'lucide-react';

const productSchema = z.object({
  // Basic
  name: z.string().min(3, 'Nome muito curto'),
  type: z.enum(['PRODUCT', 'SERVICE']),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  
  // Financial
  costPrice: z.number().min(0).optional(),
  margin: z.number().min(0).optional(),
  price: z.number().min(0, 'Preço inválido'),
  
  // Stock
  unit: z.string().min(1, 'Unidade obrigatória'),
  minStock: z.number().min(0),
  allowNegativeStock: z.boolean(),
  
  // Fiscal
  ncm: z.string().optional(),
  cest: z.string().optional(),
  cfop: z.string().optional(),
  
  // Extra
  notes: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'stock' | 'fiscal'>('basic');

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: 'PRODUCT',
      unit: 'UN',
      minStock: 0,
      allowNegativeStock: false,
      price: 0,
    }
  });

  // Watch for financial calculation
  const costPrice = useWatch({ control, name: 'costPrice' });
  const margin = useWatch({ control, name: 'margin' });
  const price = useWatch({ control, name: 'price' });

  // Bi-directional calculations (simplified)  
  const handleCostOrMarginChange = (c: number = 0, m: number = 0) => {
     if (c > 0 && m >= 0) {
        const p = c * (1 + (m / 100));
        setValue('price', Number(p.toFixed(2)), { shouldValidate: true });
     }
  };

  const handlePriceChange = (c: number = 0, p: number = 0) => {
     if (c > 0 && p > 0) {
        const m = ((p - c) / c) * 100;
        setValue('margin', Number(m.toFixed(2)), { shouldValidate: true });
     }
  };

  const generateSKU = () => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setValue('sku', `PRD-${random}`, { shouldValidate: true });
  };

  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const token = localStorage.getItem('@ERP:token');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Falha ao salvar produto');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto salvo com sucesso!');
      reset();
      setActiveTab('basic');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };

  const tabs = [
    { id: 'basic', label: 'Básico', icon: Box },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'stock', label: 'Estoque', icon: Tag },
    { id: 'fiscal', label: 'Fiscal / Outros', icon: FileText },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cadastrar Produto/Serviço">
      <div className="flex border-b border-neutral-200 mb-6 -mx-6 px-6 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* BASIC TAB */}
        <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-neutral-700 mb-1">Nome do Produto *</label>
                 <input {...register('name')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Notebook Dell Inspiron" />
                 {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              
              <div>
                 <div className="flex justify-between">
                   <label className="block text-sm font-medium text-neutral-700 mb-1">SKU</label>
                   <button type="button" onClick={generateSKU} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Gerar</button>
                 </div>
                 <input {...register('sku')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg uppercase" placeholder="PRD-0001" />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">Código de Barras (EAN)</label>
                 <input {...register('barcode')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="Sem código" />
              </div>

              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                 <select {...register('type')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white">
                    <option value="PRODUCT">Produto Físico</option>
                    <option value="SERVICE">Serviço</option>
                 </select>
              </div>
           </div>
        </div>

        {/* FINANCIAL TAB */}
        <div className={activeTab === 'financial' ? 'block' : 'hidden'}>
           <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-1">Preço de Custo (R$)</label>
                   <input 
                     {...register('costPrice', { valueAsNumber: true })} 
                     type="number" step="0.01" min="0"
                     onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue('costPrice', val);
                        handleCostOrMarginChange(val, margin);
                     }}
                     className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="0.00" 
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-1">Margem Lucro (%)</label>
                   <input 
                     {...register('margin', { valueAsNumber: true })} 
                     type="number" step="0.01" min="0"
                     onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue('margin', val);
                        handleCostOrMarginChange(costPrice, val);
                     }}
                     className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="0.00" 
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-neutral-700 mb-1">Preço de Venda (R$) *</label>
                   <input 
                     {...register('price', { valueAsNumber: true })} 
                     type="number" step="0.01" min="0"
                     onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue('price', val);
                        handlePriceChange(costPrice, val);
                     }}
                     className="w-full px-3 py-2 border-indigo-300 bg-white shadow-sm rounded-lg focus:ring-indigo-500 font-semibold text-indigo-900" placeholder="0.00" 
                   />
                   {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
             </div>
           </div>
        </div>

        {/* STOCK TAB */}
        <div className={activeTab === 'stock' ? 'block' : 'hidden'}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">Unidade de Medida</label>
                 <select {...register('unit')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white">
                    <option value="UN">Unidade (UN)</option>
                    <option value="KG">Quilograma (KG)</option>
                    <option value="LT">Litro (LT)</option>
                    <option value="CX">Caixa (CX)</option>
                    <option value="MT">Metro (MT)</option>
                    <option value="HR">Hora (HR) - Serviços</option>
                 </select>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">Estoque Mínimo</label>
                 <input {...register('minStock', { valueAsNumber: true })} type="number" step="0.01" className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="0" />
              </div>

              <div className="md:col-span-2 pt-2">
                 <label className="flex items-center gap-3 cursor-pointer p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                    <input type="checkbox" {...register('allowNegativeStock')} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                       <p className="text-sm font-medium text-neutral-900">Permitir estoque negativo</p>
                       <p className="text-xs text-neutral-500">O PDV poderá vender este item mesmo sem saldo em estoque.</p>
                    </div>
                 </label>
              </div>
           </div>
        </div>

        {/* FISCAL TAB */}
        <div className={activeTab === 'fiscal' ? 'block' : 'hidden'}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">NCM</label>
                 <input {...register('ncm')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="0000.00.00" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">CEST</label>
                 <input {...register('cest')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="00.000.00" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-neutral-700 mb-1">CFOP Padrão (Saída)</label>
                 <input {...register('cfop')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg" placeholder="5102" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-neutral-700 mb-1">Observações Internas</label>
                 <textarea {...register('notes')} className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-none" rows={3} placeholder="Anotações sobre o produto..."></textarea>
              </div>
           </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-6 mt-6 border-t border-neutral-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Produto
          </button>
        </div>
      </form>
    </Modal>
  );
}
