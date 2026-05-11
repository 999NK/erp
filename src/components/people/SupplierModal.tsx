import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Loader2, Save, Search, Building2, MapPin, CreditCard, FileText, Upload } from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(3, 'Nome/Razão Social é obrigatório'),
  businessName: z.string().optional(),
  document: z.string().min(14, 'CNPJ inválido'), // Add proper mask later
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  mobilePhone: z.string().optional(),
  landline: z.string().optional(),
  
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),

  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  foundationDate: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),

  pixKey: z.string().optional(),
  bankAccount: z.string().optional(),
  category: z.string().optional(),
  averageDeliveryTime: z.string().optional(),
  contractUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SupplierModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'financial' | 'notes'>('basic');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { isActive: true }
  });

  const zipCode = watch('zipCode');
  const documentId = watch('document');

  const saveMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const token = localStorage.getItem('@ERP:token');
      const response = await fetch('/api/people/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao salvar fornecedor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      reset();
      onClose();
    }
  });

  const onSubmit = (data: SupplierFormValues) => saveMutation.mutate(data);

  const fetchCep = async () => {
    if (!zipCode || zipCode.replace(/\D/g, '').length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${zipCode.replace(/\D/g, '')}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setValue('street', data.logradouro);
        setValue('neighborhood', data.bairro);
        setValue('city', data.localidade);
        setValue('state', data.uf);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCnpj = async () => {
    if (!documentId || documentId.replace(/\D/g, '').length !== 14) return;
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${documentId.replace(/\D/g, '')}`);
      const data = await res.json();
      if (data.razao_social) {
        setValue('name', data.razao_social);
        setValue('businessName', data.nome_fantasia || data.razao_social);
        if (data.cep) setValue('zipCode', data.cep.toString());
        if (data.logradouro) setValue('street', data.logradouro);
        if (data.numero) setValue('number', data.numero);
        if (data.complemento) setValue('complement', data.complemento);
        if (data.bairro) setValue('neighborhood', data.bairro);
        if (data.municipio) setValue('city', data.municipio);
        if (data.uf) setValue('state', data.uf);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Fornecedor" size="5xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        {/* TABS */}
        <div className="flex border-b border-gray-200 mb-6">
           <button type="button" onClick={() => setActiveTab('basic')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4"/> Básicas</div>
           </button>
           <button type="button" onClick={() => setActiveTab('address')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'address' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> Endereço</div>
           </button>
           <button type="button" onClick={() => setActiveTab('financial')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'financial' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> Financeiro & Compras</div>
           </button>
           <button type="button" onClick={() => setActiveTab('notes')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> Contrato & Notas</div>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          {/* BASIC TAB */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                  <div className="flex gap-2">
                    <input {...register('document')} type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="00.000.000/0000-00" />
                    <button type="button" onClick={fetchCnpj} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Buscar Dados por CNPJ"><Search className="w-4 h-4"/></button>
                  </div>
                  {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria de Fornecedor</label>
                  <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                     <option value="">Selecione...</option>
                     <option value="insumos">Insumos/Matéria-Prima</option>
                     <option value="servicos">Serviços Terceirizados</option>
                     <option value="equipamentos">Equipamentos/Ativos</option>
                     <option value="utilidades">Utilidades (Água, Luz, etc)</option>
                  </select>
               </div>
               <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
                  <input {...register('name')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
               </div>
               <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                  <input {...register('businessName')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                  <input {...register('mobilePhone')} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="(11) 90000-0000" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Comercial</label>
                  <input {...register('email')} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="vendas@fornecedor.com" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual (IE)</label>
                  <input {...register('stateRegistration')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Municipal (IM)</label>
                  <input {...register('municipalRegistration')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === 'address' && (
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <div className="flex gap-2">
                    <input {...register('zipCode')} type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="00000-000" />
                    <button type="button" onClick={fetchCep} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Buscar Endereço"><Search className="w-4 h-4"/></button>
                  </div>
               </div>
               <div></div>
               <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro / Rua</label>
                  <input {...register('street')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input {...register('number')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input {...register('complement')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input {...register('neighborhood')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input {...register('city')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                    <input {...register('state')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
               </div>
            </div>
          )}

          {/* FINANCIAL TAB */}
          {activeTab === 'financial' && (
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-xl mb-2">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-500"/> Dados para Pagamento</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Chave Pix</label>
                        <input {...register('pixKey')} type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="CPF/CNPJ, Email, Telefone..." />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Conta Bancária (Banco, Ag, CC)</label>
                        <input {...register('bankAccount')} type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Ex: Itaú (341), Ag: 1234, CC: 12345-6" />
                     </div>
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Médio de Entrega (Dias)</label>
                  <input {...register('averageDeliveryTime')} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: 5" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('isActive', { setValueAs: v => v === 'true' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                     <option value="true">Ativo</option>
                     <option value="false">Inativo</option>
                  </select>
               </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anexo de Contrato / Tabela de Preços</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors cursor-pointer group">
                     <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500" />
                        <div className="flex text-sm text-gray-600 justify-center">
                           <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                              <span>Faça upload do arquivo</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                           </span>
                           <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOCX ou XLSX até 10MB</p>
                     </div>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input {...register('tags')} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Importado, Confiança, Alto Custo" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
                  <textarea {...register('notes')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
               </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Fornecedor
          </button>
        </div>
      </form>
    </Modal>
  );
}
