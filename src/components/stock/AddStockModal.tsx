import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Loader2, Barcode, Plus, Package, MapPin, Layers, Coins, ClipboardList, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  costPrice: number | null;
  unit: string;
  minStock: number;
  category?: { name: string } | null;
}

interface Location {
  id: string;
  name: string;
  isDefault: boolean;
}

interface AddStockModalProps {
  onClose: () => void;
}

export function AddStockModal({ onClose }: AddStockModalProps) {
  const queryClient = useQueryClient();

  // Form states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [realQuantity, setRealQuantity] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');

  // Autocomplete UI states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products for autocomplete
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-autocomplete', debouncedSearch],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedSearch)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao buscar produtos');
      const json = await res.json();
      return json.data as Product[];
    },
    enabled: isDropdownOpen
  });

  const products = productsData || [];

  // Fetch locations
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['stock-locations'],
    queryFn: async () => {
      const token = localStorage.getItem('@ERP:token');
      const res = await fetch('/api/stock/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao buscar locais de estoque');
      const json = await res.json();
      return json.data as Location[];
    }
  });

  const locations = locationsData || [];

  // Set default location when loaded
  useEffect(() => {
    if (locations.length > 0 && !locationId) {
      const defaultLoc = locations.find(loc => loc.isDefault) || locations[0];
      setLocationId(defaultLoc.id);
    }
  }, [locations, locationId]);

  // Handle barcode exact match or quick scanner enter
  useEffect(() => {
    if (products.length === 1 && debouncedSearch === products[0].barcode) {
      handleSelectProduct(products[0]);
    }
  }, [products, debouncedSearch]);

  // Handle selecting a product
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setUnitCost(product.costPrice || 0);
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
    toast.success(`Selecionado: ${product.name}`);
  };

  // Keyboard navigation for autocomplete dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < products.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < products.length) {
        handleSelectProduct(products[focusedIndex]);
      } else if (products.length > 0) {
        handleSelectProduct(products[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Create Stock Movement Mutation
  const createMovementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error('Produto é obrigatório');
      const token = localStorage.getItem('@ERP:token');

      const payload: any = {
        productId: selectedProduct.id,
        locationId,
        type: movementType,
        unitCost,
        notes: notes || undefined,
        reference: reference || undefined,
      };

      if (movementType === 'ADJUSTMENT') {
        payload.realQuantity = realQuantity;
      } else {
        payload.quantity = quantity;
      }

      const res = await fetch('/api/stock/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao registrar movimentação');
      return json;
    },
    onSuccess: () => {
      toast.success('Movimentação registrada e estoque atualizado!');
      queryClient.invalidateQueries({ queryKey: ['stock-snapshots'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Falha ao salvar estoque');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error('Por favor, selecione um produto.');
      return;
    }
    if (movementType === 'ADJUSTMENT' && !notes) {
      toast.error('O campo Observação/Justificativa é obrigatório para Ajustes.');
      return;
    }
    createMovementMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col text-gray-900 border-l border-gray-100"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Adicionar ao Estoque</h2>
              <p className="text-xs text-gray-500">Registre entradas, ajustes e transferências no inventário</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Product Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" />
              1. Seleção de Produto
            </label>
            
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Pesquisar por Nome, SKU ou Código de Barras..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-11 pr-10 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (searchTerm || isDropdownOpen) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl divide-y divide-gray-50"
                  >
                    {isLoadingProducts ? (
                      <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Buscando catálogo...
                      </div>
                    ) : products.length > 0 ? (
                      products.map((prod, index) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSelectProduct(prod)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-indigo-50/50 transition-colors ${
                            focusedIndex === index ? 'bg-indigo-50/70 font-medium' : ''
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{prod.name}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              {prod.sku && <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">SKU: {prod.sku}</span>}
                              {prod.barcode && <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[10px]">EAN: {prod.barcode}</span>}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Nenhum produto cadastrado encontrado
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Selected Product Card (Visual Metadata) */}
          <AnimatePresence>
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500">Produto Ativo no Catálogo</span>
                    <h4 className="text-base font-bold text-gray-900">{selectedProduct.name}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 font-mono mt-1">
                      {selectedProduct.sku && <span className="bg-white border border-indigo-50 px-1.5 py-0.5 rounded">SKU: {selectedProduct.sku}</span>}
                      {selectedProduct.barcode && <span className="bg-white border border-indigo-50 px-1.5 py-0.5 rounded">Barcode: {selectedProduct.barcode}</span>}
                      {selectedProduct.category && <span className="bg-white border border-indigo-50 px-1.5 py-0.5 rounded">{selectedProduct.category.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-indigo-100/40">
                  <div>
                    <span className="text-xs text-gray-500 block">Preço de Venda</span>
                    <span className="text-sm font-bold font-mono text-emerald-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Último Custo de Compra</span>
                    <span className="text-sm font-bold font-mono text-gray-700">
                      {selectedProduct.costPrice 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.costPrice)
                        : 'Não cadastrado'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section 2: Stock Information */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              2. Detalhes da Movimentação
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Stock Location */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  Local / Filial
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                >
                  {isLoadingLocations ? (
                    <option>Carregando locais...</option>
                  ) : (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.isDefault ? '(Padrão)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Movement Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Tipo de Operação
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                >
                  <option value="IN">Entrada (+)</option>
                  <option value="OUT">Saída (-)</option>
                  <option value="ADJUSTMENT">Ajuste de Balanço (=)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity input */}
              {movementType !== 'ADJUSTMENT' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    Quantidade Inicial
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    Quantidade Real Física
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={realQuantity}
                    onChange={(e) => setRealQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-mono"
                  />
                </div>
              )}

              {/* Unit Cost input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-indigo-500" />
                  Custo Unitário Atual (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-mono"
                />
              </div>
            </div>

            {/* Reference document / Invoice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                Número Documento / Nota Fiscal (NF)
              </label>
              <input
                type="text"
                placeholder="Ex: NF-10982 ou DOC-332"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Notes / Reason for Adjustment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                Observação / Justificativa {movementType === 'ADJUSTMENT' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                placeholder={movementType === 'ADJUSTMENT' ? "Explique o motivo do ajuste físico obrigatório..." : "Escreva observações adicionais..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMovementMutation.isPending || !selectedProduct}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 hover:shadow-lg"
          >
            {createMovementMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar Entrada no Estoque'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
