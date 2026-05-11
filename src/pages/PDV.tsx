import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePosStore } from '../store/posStore';
import { ShoppingCart, CheckCircle2, Search, X, CreditCard, Banknote, QrCode, Grid, ClipboardList, PackageCheck, Trash2, ArrowLeft } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { formatCurrency } from '../lib/formatters';
import { apiFetch } from '../hooks/useUtils';

export function PDVPage() {
  const { items, sessionId, searchQuery, isCheckingOut, cashTendered, paymentMethod,
    setSearchQuery, addItem, removeItem, updateQuantity, clearCart, setSessionId, setCheckingOut,
    setCashTendered, setPaymentMethod, cartTotal, cartQty } = usePosStore();

  const [products, setProducts] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Mobile UI Sub-Tabs: 'catalog' vs 'cart'
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionRes, prodRes] = await Promise.all([
          apiFetch('/api/sales/session'),
          apiFetch('/api/products'),
        ]);
        
        if (sessionRes.success && sessionRes.data) {
          setSessionId(sessionRes.data.id);
        } else {
          setShowOpenSession(true);
        }

        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.error('Failed to load PDV data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setSessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'F2') {
        e.preventDefault();
        if (!isCheckingOut && items.length > 0) setCheckingOut(true);
      } else if (e.key === 'Enter' && isCheckingOut) {
         e.preventDefault();
         submitSale();
      } else if (e.key === 'F4') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'Escape') {
        setCheckingOut(false);
        setErrorMsg('');
      } else if (!isInput && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
        if (!isCheckingOut && !showOpenSession && searchInputRef.current) {
           searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckingOut, items, clearCart, setCheckingOut, showOpenSession]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = products.find(p => p.barcode === searchQuery || p.sku === searchQuery);
    if (found) {
       addItem({
          productId: found.id,
          sku: found.sku,
          name: found.name,
          quantity: 1,
          unitPrice: found.price,
          discount: 0
       });
       setSearchQuery('');
    } else {
       setErrorMsg('Produto não encontrado / SKU ou Código de barras inválido.');
       setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/sales/session/open', {
        method: 'POST',
        body: JSON.stringify({ initialBalance: parseFloat(openingBalance) })
      });
      if (res.success && res.data) {
        setSessionId(res.data.id);
        setShowOpenSession(false);
      } else {
        alert(res.message || 'Erro ao abrir caixa');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitSale = async () => {
    if (items.length === 0) return;
    const total = cartTotal();
    
    if (paymentMethod === 'CASH' && cashTendered < total) {
      setErrorMsg('Valor recebido é menor que o total da venda.');
      return;
    }

    try {
      const res = await apiFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          items: items.map(i => ({
             productId: i.productId,
             quantity: i.quantity,
             unitPrice: i.unitPrice,
             discount: i.discount
          })),
          payments: [
             { method: paymentMethod, amount: total }
          ]
        })
      });
      if (res.success) {
        clearCart();
        setCheckingOut(false);
        setMobileTab('catalog');
      } else {
        setErrorMsg(res.message || 'Erro ao registrar venda');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao finalizar venda.');
    }
  };

  // Local product search filtering for catalog tap support
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-neutral-500 text-sm font-semibold">Carregando Frente de Caixa...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Opening Session Modal */}
      <AnimatePresence>
        {showOpenSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-sm w-full border border-neutral-100">
              <h2 className="text-xl sm:text-2xl font-black mb-1.5 text-neutral-900 tracking-tight flex items-center gap-2"><PackageCheck className="w-6 h-6 text-indigo-600" /> Abrir Caixa</h2>
              <p className="text-xs text-neutral-400 font-semibold mb-6">Informe o saldo de contingência para iniciar as vendas do PDV.</p>
              <form onSubmit={handleOpenSession}>
                <div className="mb-6">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-400 mb-2">Saldo Inicial (R$)</label>
                  <input type="number" step="0.01" min="0" required
                         className="w-full text-3xl p-4 border rounded-2xl border-neutral-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-mono text-center bg-neutral-50 focus:bg-white transition-all font-black"
                         value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-100 transition cursor-pointer">Iniciar Operação</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] -m-4 sm:-m-6 lg:-m-8 bg-neutral-50/50 overflow-hidden relative">
        
        {/* Mobile-Only Tab Bar Switcher */}
        <div className="lg:hidden flex bg-white border-b border-neutral-200/60 p-1.5 shrink-0">
          <button 
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold rounded-xl transition ${mobileTab === 'catalog' ? 'bg-indigo-50 text-indigo-600' : 'text-neutral-500'}`}
          >
            <Grid className="w-4 h-4" />
            <span>Produtos</span>
          </button>
          <button 
            onClick={() => setMobileTab('cart')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold rounded-xl transition relative ${mobileTab === 'cart' ? 'bg-indigo-50 text-indigo-600' : 'text-neutral-500'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrinho</span>
            {cartQty() > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-1">
                {cartQty()}
              </span>
            )}
          </button>
        </div>

        {/* Catalog (Main product selection list) */}
        <div className={`flex-1 flex flex-col min-w-0 bg-neutral-50 ${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Barcode / Search Box */}
          <div className="bg-white p-4 sm:p-5 border-b border-neutral-200/60 shrink-0">
             <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  disabled={!sessionId || isCheckingOut || showOpenSession}
                  className="w-full text-base pl-11 pr-10 py-3 bg-neutral-50/50 border border-neutral-200 rounded-2xl focus:border-indigo-500 transition-all font-semibold shadow-inner focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="Escaneie o código de barras ou digite o nome/SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
             </form>
          </div>

          {/* Quick-alert display */}
          {errorMsg && (
            <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-red-600 font-bold text-xs flex justify-between items-center shrink-0">
              <span className="truncate">{errorMsg}</span>
              <button onClick={() => setErrorMsg('')}><X className="w-4.5 h-4.5"/></button>
            </div>
          )}

          {/* Interactive Products Grid list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-12">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-40" />
                <p className="font-bold text-neutral-500 text-sm">Nenhum produto cadastrado ou localizado</p>
                <p className="text-xs text-neutral-400 mt-1">Insira produtos no estoque ou altere os termos da busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                 {filteredProducts.map(p => {
                    const cartItem = items.find(item => item.productId === p.id);
                    const qtyInCart = cartItem?.quantity || 0;
                    return (
                       <button 
                         key={p.id}
                         onClick={() => addItem({
                            productId: p.id,
                            sku: p.sku,
                            name: p.name,
                            quantity: 1,
                            unitPrice: p.price,
                            discount: 0
                         })}
                         className="relative bg-white border border-neutral-200/70 hover:border-indigo-500 rounded-2xl p-4 text-left flex flex-col justify-between transition-all group cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100/50 shadow-sm"
                       >
                          {qtyInCart > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                              {qtyInCart}
                            </span>
                          )}
                          <div className="min-w-0 mb-4">
                             <h4 className="font-bold text-neutral-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                             <p className="text-[10px] text-neutral-400 font-mono tracking-tight mt-0.5 truncate">{p.sku}</p>
                          </div>
                          <div className="flex items-baseline justify-between w-full mt-auto border-t border-neutral-50 pt-3">
                             <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Unidade</span>
                             <span className="text-xs sm:text-sm font-extrabold font-mono text-neutral-900">{formatCurrency(p.price)}</span>
                          </div>
                       </button>
                    );
                 })}
              </div>
            )}
          </div>

          {/* Quick Sticky Bottom Bar for Mobile Product Tab */}
          {cartQty() > 0 && (
            <div className="lg:hidden bg-white border-t border-neutral-200/60 p-4 flex items-center justify-between shadow-lg shrink-0">
               <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Acumulado</p>
                  <p className="text-lg font-black font-mono text-indigo-600">{formatCurrency(cartTotal())}</p>
               </div>
               <button 
                 onClick={() => setMobileTab('cart')}
                 className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-100 cursor-pointer"
               >
                 <span>Ver Carrinho ({cartQty()})</span>
               </button>
            </div>
          )}
        </div>

        {/* Cart items list / Sidebar (visible on desktop or active mobile tab) */}
        <div className={`w-full lg:w-96 bg-white flex flex-col border-l border-neutral-200/60 shrink-0 ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* POS keyboard shortcut legend (Desktop only) */}
          <div className="hidden lg:grid p-3 bg-neutral-50 border-b border-neutral-200/60 text-[10px] text-neutral-400 font-bold uppercase tracking-wider grid-cols-2 gap-2">
             <div><kbd className="font-mono bg-white border border-neutral-200 px-1 rounded shadow-sm mr-1.5 text-neutral-500">F2</kbd> Pagar</div>
             <div><kbd className="font-mono bg-white border border-neutral-200 px-1 rounded shadow-sm mr-1.5 text-neutral-500">F4</kbd> Limpar</div>
          </div>

          {/* Checkout views wrapper */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col min-h-0 relative">
            
            {isCheckingOut ? (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col h-full justify-between">
                
                {/* Checkout header */}
                <div className="mb-5 flex items-center gap-2">
                  <button onClick={() => setCheckingOut(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl bg-neutral-50 border border-neutral-100"><ArrowLeft className="w-4 h-4" /></button>
                  <h3 className="font-bold text-neutral-900 text-sm sm:text-base tracking-tight">Formas de Liquidação</h3>
                </div>

                {/* Payment method cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  <button onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'CASH' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/20' : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'}`}>
                    <Banknote className="w-6 h-6" />
                    <span className="text-xs">Dinheiro</span>
                  </button>
                  <button onClick={() => setPaymentMethod('CREDIT_CARD')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'CREDIT_CARD' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/20' : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'}`}>
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs">Crédito</span>
                  </button>
                  <button onClick={() => setPaymentMethod('DEBIT_CARD')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'DEBIT_CARD' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/20' : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'}`}>
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs">Débito</span>
                  </button>
                  <button onClick={() => setPaymentMethod('PIX')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'PIX' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/20' : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'}`}>
                    <QrCode className="w-6 h-6" />
                    <span className="text-xs">PIX</span>
                  </button>
                </div>

                {/* Details calculation overlay */}
                <div className="space-y-4 mb-6">
                  {paymentMethod === 'CASH' ? (
                    <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1.5">Valor Recebido (R$)</label>
                        <input autoFocus type="number" step="0.01" min="0" placeholder="0.00"
                               className="w-full text-2xl font-black p-3 border border-neutral-200 rounded-xl focus:ring-4 focus:outline-none font-mono text-right bg-white focus:border-indigo-500"
                               value={cashTendered || ''} onChange={e => setCashTendered(parseFloat(e.target.value) || 0)} />
                      </div>
                      
                      <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1">
                         <button type="button" onClick={() => setCashTendered(cartTotal())} className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-600 shadow-sm transition">Exato</button>
                         <button type="button" onClick={() => setCashTendered((cashTendered || 0) + 10)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 shadow-sm transition">+10</button>
                         <button type="button" onClick={() => setCashTendered((cashTendered || 0) + 20)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 shadow-sm transition">+20</button>
                         <button type="button" onClick={() => setCashTendered((cashTendered || 0) + 50)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 shadow-sm transition">+50</button>
                      </div>

                      {cashTendered >= cartTotal() ? (
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex justify-between items-center text-green-800">
                          <span className="font-bold text-xs">Troco:</span>
                          <span className="text-xl font-extrabold font-mono">{formatCurrency(cashTendered - cartTotal())}</span>
                        </div>
                      ) : ( cashTendered > 0 && cashTendered < cartTotal() && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 text-xs font-bold flex items-center justify-between">
                           <span>Valor insuficiente</span>
                           <span className="font-mono">Falta {formatCurrency(cartTotal() - cashTendered)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/60 flex flex-col items-center justify-center text-center gap-3">
                      <QrCode className="w-10 h-10 text-neutral-300" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Aguardando Captura</p>
                        <p className="text-xl font-extrabold font-mono text-neutral-800 mt-1">{formatCurrency(cartTotal())}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final transaction actions */}
                <div className="space-y-2 mt-auto">
                  <button onClick={submitSale} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl text-base shadow-lg shadow-emerald-500/20 transition flex justify-center items-center gap-2 cursor-pointer">
                     <CheckCircle2 className="w-5 h-5" />
                     <span>Finalizar Venda (Enter)</span>
                  </button>
                  <button onClick={() => setCheckingOut(false)} className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-500 font-bold py-3 rounded-xl text-xs transition cursor-pointer">
                     Voltar ao Pedido (ESC)
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {/* Cart list items flow */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0 pr-1">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-16">
                      <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
                      <p className="font-bold text-xs text-neutral-400">Carrinho vazio</p>
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.productId} className="bg-neutral-50/50 p-3 rounded-xl border border-neutral-100 flex items-center justify-between group">
                        <div className="min-w-0 pr-2">
                           <h4 className="font-bold text-neutral-800 text-xs truncate">{item.name}</h4>
                           <p className="text-[10px] text-neutral-400 font-mono truncate">{item.sku}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} className="w-6 h-6 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center font-bold text-xs cursor-pointer">-</button>
                             <span className="w-6 text-center font-extrabold text-neutral-800 text-xs">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center font-bold text-xs cursor-pointer">+</button>
                           </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end">
                           <span className="font-bold font-mono text-neutral-900 text-xs">{formatCurrency(item.total)}</span>
                           <span className="text-[9px] text-neutral-400 font-medium font-mono mt-0.5">{formatCurrency(item.netPrice)}/un</span>
                           <button onClick={() => removeItem(item.productId)} className="text-neutral-300 hover:text-red-500 transition mt-2 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotals card summary */}
                <div className="border-t border-neutral-200/60 pt-4 shrink-0 space-y-3">
                  <div className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-100 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Subtotal ({cartQty()} itens)</span>
                      <span className="font-mono text-neutral-600">{formatCurrency(cartTotal())}</span>
                    </div>
                    <div className="flex justify-between text-neutral-900 border-t pt-2 border-neutral-100 font-bold text-sm">
                      <span>Total Geral:</span>
                      <span className="font-mono text-indigo-600 text-base">{formatCurrency(cartTotal())}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => { if(items.length > 0) setCheckingOut(true); }}
                      disabled={items.length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-sm shadow-md shadow-indigo-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Ir Para Pagamento (F2)</span>
                    </button>
                    {items.length > 0 && (
                      <button onClick={clearCart} className="w-full text-red-500 font-bold py-2 hover:bg-red-50 rounded-xl text-xs transition cursor-pointer">
                        Limpar Carrinho (F4)
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </MainLayout>
  );
}
export default PDVPage;
