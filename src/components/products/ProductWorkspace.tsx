import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Package, Settings, Search, AlertCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  productId: string;
  onClose: () => void;
}

export function ProductWorkspace({ productId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'movements' | 'pricing' | 'settings'>('info');

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao carregar produto');
      return (await res.json()).data;
    }
  });

  const { data: snapshotsData } = useQuery({
    queryKey: ['stock-snapshots', productId],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/stock/snapshots?productId=${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return (await res.json()).data;
    }
  });

  const { data: movementsData } = useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/stock/movements?productId=${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return (await res.json()).data;
    }
  });

  const { data: priceHistoryData } = useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/products/${productId}/price-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return (await res.json()).data;
    }
  });

  // Derived stock
  const currentStock = snapshotsData?.reduce((acc: number, snap: any) => acc + snap.quantity, 0) || 0;
  const valuation = currentStock * (productData?.costPrice || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{productData?.name || 'Carregando...'}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
               <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{productData?.sku}</span>
               <span>{productData?.type === 'SERVICE' ? 'Serviço' : 'Produto Físico'}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-6 border-b border-gray-100 bg-gray-50/50 overflow-x-auto hide-scrollbar">
          {[
            { id: 'info', label: 'Visão Geral', icon: Activity },
            { id: 'movements', label: 'Movimentações', icon: Package },
            { id: 'pricing', label: 'Precificação', icon: DollarSign },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-100 rounded-xl"></div><div className="h-40 bg-gray-100 rounded-xl"></div></div>}
          
          {!isLoading && activeTab === 'info' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">Estoque Atual</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-3xl font-bold font-mono">{currentStock}</h3>
                       <span className="text-sm text-gray-500">{productData?.unit}</span>
                    </div>
                    {currentStock <= (productData?.minStock || 0) && (
                       <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium bg-red-50 w-fit px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3"/> Baixo estoque</p>
                    )}
                 </div>
                 
                 <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">Preço de Venda</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-3xl font-bold font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(productData?.price || 0)}
                       </h3>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                       Margem: {productData?.price && productData?.costPrice ? (((productData.price - productData.costPrice) / productData.price) * 100).toFixed(2) + '%' : 'N/A'}
                    </p>
                 </div>

                 <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">Valuation (Custo)</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-3xl font-bold font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valuation)}
                       </h3>
                    </div>
                 </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                 <h4 className="font-semibold text-gray-900 mb-4">Detalhes Cadastrais</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
                    <div>
                       <p className="text-gray-500 mb-1">Cód. Barras (EAN)</p>
                       <p className="font-medium text-gray-900 font-mono">{productData?.barcode || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-gray-500 mb-1">NCM</p>
                       <p className="font-medium text-gray-900">{productData?.ncm || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-gray-500 mb-1">CEST</p>
                       <p className="font-medium text-gray-900">{productData?.cest || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-gray-500 mb-1">CFOP</p>
                       <p className="font-medium text-gray-900">{productData?.cfop || 'N/A'}</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'movements' && (
            <div className="space-y-6">
               <div className="flex gap-3 justify-end">
                  <StockMovementAction productId={productData?.id} type="ADJUSTMENT" onSuccess={() => queryClient.invalidateQueries()} />
                  <StockMovementAction productId={productData?.id} type="IN" onSuccess={() => queryClient.invalidateQueries()} />
                  <StockMovementAction productId={productData?.id} type="OUT" onSuccess={() => queryClient.invalidateQueries()} />
               </div>

               <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                        <tr>
                           <th className="px-4 py-3 font-medium">Data</th>
                           <th className="px-4 py-3 font-medium">Tipo</th>
                           <th className="px-4 py-3 font-medium">Qtd</th>
                           <th className="px-4 py-3 font-medium">Motivo/Ref</th>
                           <th className="px-4 py-3 font-medium">Operador</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {movementsData?.length === 0 && (
                           <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhuma movimentação registrada</td></tr>
                        )}
                        {movementsData?.map((mov: any) => (
                           <tr key={mov.id}>
                              <td className="px-4 py-3 text-gray-600">{new Date(mov.createdAt).toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3">
                                 {mov.type === 'IN' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><ArrowDownRight className="w-3 h-3 mr-1"/> Entrada</span>}
                                 {mov.type === 'OUT' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><ArrowUpRight className="w-3 h-3 mr-1"/> Saída</span>}
                                 {mov.type === 'ADJUSTMENT' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Ajuste</span>}
                              </td>
                              <td className={`px-4 py-3 font-mono font-medium ${mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{mov.notes || mov.reference || '-'}</td>
                              <td className="px-4 py-3 text-gray-600">{mov.user?.name || '-'}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {!isLoading && activeTab === 'pricing' && (
             <div className="space-y-6">
               <PriceChangeAction product={productData} onSuccess={() => queryClient.invalidateQueries()} />

               <div>
                 <h4 className="text-base font-semibold text-gray-900 mb-3">Histórico de Alterações</h4>
                 <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                    {priceHistoryData?.length === 0 && (
                       <p className="pl-6 text-sm text-gray-500 py-2">Nenhuma alteração de preço registrada.</p>
                    )}
                    {priceHistoryData?.map((history: any, idx: number) => (
                       <div key={history.id} className="relative pl-6">
                          <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <p className="text-sm font-medium text-gray-900">Preço alterado para <span className="font-mono text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(history.newPrice)}</span></p>
                                   <p className="text-xs text-gray-500 mt-0.5">
                                      Anterior: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(history.oldPrice)}
                                      {history.percentageApplied && (
                                         <span className={`ml-2 font-medium ${history.percentageApplied > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            ({history.percentageApplied > 0 ? '+' : ''}{history.percentageApplied}%)
                                         </span>
                                      )}
                                   </p>
                                </div>
                                <span className="text-xs text-gray-500">{new Date(history.createdAt).toLocaleString('pt-BR')}</span>
                             </div>
                             <div className="text-sm bg-gray-50 p-2 rounded text-gray-600 border border-gray-100">
                                <p><span className="font-medium">Motivo:</span> {history.reason || 'Não informado'}</p>
                                <p className="mt-1 text-xs text-gray-500">Alterado por: {history.user?.name}</p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
             </div>
          )}

          {!isLoading && activeTab === 'settings' && (
             <div className="space-y-6">
                <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
                   <h4 className="font-semibold mb-2">Status do Produto</h4>
                   <p className="text-sm text-gray-500 mb-4">Ao inativar este produto, ele não aparecerá mais no PDV ou novas vendas.</p>
                   
                   <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${productData?.isActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                      {productData?.isActive ? 'Inativar Produto' : 'Reativar Produto'}
                   </button>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Subcomponents for actions
function StockMovementAction({ productId, type, onSuccess }: { productId: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; onSuccess: () => void }) {
   const [isOpen, setIsOpen] = useState(false);
   const [quantity, setQuantity] = useState('');
   const [notes, setNotes] = useState('');
   const queryClient = useQueryClient();

   const labels = {
      IN: { btn: 'Entrada', title: 'Registrar Entrada' },
      OUT: { btn: 'Saída', title: 'Registrar Saída (Manual)' },
      ADJUSTMENT: { btn: 'Ajuste', title: 'Ajuste Real de Estoque' }
   };

   const mutation = useMutation({
      mutationFn: async () => {
         const token = localStorage.getItem('@ERP:token');
         const payload: any = {
            productId,
            type,
            notes
         };
         
         if (type === 'ADJUSTMENT') {
            payload.realQuantity = Number(quantity);
         } else {
            payload.quantity = Number(quantity);
         }
         
         const res = await fetch('/api/stock/movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
         });
         if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Erro ao salvar');
         }
         return res.json();
      },
      onSuccess: () => {
         toast.success('Movimentação registrada com sucesso');
         setIsOpen(false);
         setQuantity('');
         setNotes('');
         onSuccess();
      },
      onError: (e: any) => toast.error(e.message)
   });

   return (
      <>
         <button onClick={() => setIsOpen(true)} className="px-3 py-1.5 bg-white border border-gray-300 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-colors">
            {labels[type].btn}
         </button>
         
         {isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{labels[type].title}</h3>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {type === 'ADJUSTMENT' ? 'Quantidade Real (Contagem Física)' : 'Quantidade'}
                        </label>
                        <input type="number" step="0.01" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="0" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {type === 'ADJUSTMENT' ? 'Motivo (Obrigatório)' : 'Motivo / Observação'}
                        </label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none" rows={3}></textarea>
                     </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                     <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                     <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !quantity} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                        Confirmar
                     </button>
                  </div>
               </div>
            </div>
         )}
      </>
   )
}

function PriceChangeAction({ product, onSuccess }: { product: any; onSuccess: () => void }) {
   const [price, setPrice] = useState(product?.price || 0);
   const [reason, setReason] = useState('');
   
   const applyPercentage = (percent: number) => {
      const current = Number(product?.price || 0);
      setPrice(Number((current * (1 + percent / 100)).toFixed(2)));
   };

   const mutation = useMutation({
      mutationFn: async () => {
         if (Number(price) === product.price) return;
         const token = localStorage.getItem('@ERP:token');
         const percentage = ((Number(price) - product.price) / product.price) * 100;
         
         const res = await fetch(`/api/products/${product.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
               price: Number(price), 
               reason,
               percentageApplied: percentage !== 0 ? Number(percentage.toFixed(2)) : undefined 
            })
         });
         if (!res.ok) throw new Error('Erro ao atualizar preço');
         return res.json();
      },
      onSuccess: () => {
         toast.success('Preço atualizado com sucesso!');
         setReason('');
         onSuccess();
      },
      onError: (e: any) => toast.error(e.message)
   });

   return (
      <div className="bg-white border flex flex-col md:flex-row gap-6 text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
         <div className="flex-1 space-y-4">
            <h4 className="font-semibold text-lg">Atualização Inteligente de Preço</h4>
            <div className="flex flex-wrap gap-2 mb-4">
               {[5, 10, 15, 20].map(p => (
                  <button key={`up_${p}`} onClick={() => applyPercentage(p)} className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium rounded-md border border-emerald-200">
                     +{p}%
                  </button>
               ))}
               {[-5, -10, -15, -20].map(p => (
                  <button key={`down_${p}`} onClick={() => applyPercentage(p)} className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm font-medium rounded-md border border-rose-200">
                     {p}%
                  </button>
               ))}
               <button onClick={() => setPrice(product?.price || 0)} className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium rounded-md ml-auto">
                  Resetar
               </button>
            </div>
            <div className="flex gap-4 items-start">
               <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Novo Preço de Venda (R$)</label>
                  <input 
                     type="number" 
                     step="0.01" 
                     value={price}
                     onChange={e => setPrice(e.target.value)}
                     className="w-full border-indigo-200 bg-indigo-50 focus:ring-indigo-500 font-mono text-xl text-indigo-900 rounded-lg px-4 py-2" 
                  />
               </div>
            </div>
         </div>
         
         <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col">
            <div className="flex-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Justificativa</label>
               <textarea 
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Reajuste do fornecedor, Promoção..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none h-20 text-sm"
               />
            </div>
            <button 
               onClick={() => mutation.mutate()}
               disabled={mutation.isPending || Number(price) === product?.price}
               className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
               Confirmar Alteração
            </button>
            <p className="text-xs text-center text-gray-500">Ação registrada no ledger de auditoria.</p>
         </div>
      </div>
   );
}
