import { create } from 'zustand';

export interface PosItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  netPrice: number;
  total: number;
}

interface PosState {
  items: PosItem[];
  sessionId: string | null;
  searchQuery: string;
  cashTendered: number;
  paymentMethod: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX";
  isCheckingOut: boolean;
  
  setSearchQuery: (query: string) => void;
  setCashTendered: (amount: number) => void;
  setPaymentMethod: (method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX") => void;
  setCheckingOut: (val: boolean) => void;

  addItem: (item: Omit<PosItem, 'netPrice' | 'total'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSessionId: (id: string | null) => void;
  
  cartTotal: () => number;
  cartDisc: () => number;
  cartQty: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  sessionId: null,
  searchQuery: '',
  cashTendered: 0,
  paymentMethod: 'CASH',
  isCheckingOut: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCashTendered: (amount) => set({ cashTendered: amount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCheckingOut: (val) => set({ isCheckingOut: val, cashTendered: 0 }),
  
  addItem: (newItem) => set((state) => {
    const existing = state.items.find(i => i.productId === newItem.productId);
    const netPrice = newItem.unitPrice - newItem.discount;

    if (existing) {
      const updatedQty = existing.quantity + newItem.quantity;
      return {
        items: state.items.map(i => i.productId === newItem.productId ? {
          ...i,
          quantity: updatedQty,
          total: updatedQty * i.netPrice
        } : i)
      };
    } else {
      return {
        items: [...state.items, {
          ...newItem,
          netPrice,
          total: newItem.quantity * netPrice
        }]
      };
    }
  }),
  
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.productId !== productId)
  })),
  
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(i => i.productId === productId ? {
      ...i,
      quantity,
      total: quantity * i.netPrice
    } : i)
  })),
  
  clearCart: () => set({ items: [], isCheckingOut: false, cashTendered: 0 }),
  
  setSessionId: (id) => set({ sessionId: id }),
  
  cartTotal: () => get().items.reduce((acc, item) => acc + item.total, 0),
  cartDisc: () => get().items.reduce((acc, item) => acc + (item.discount * item.quantity), 0),
  cartQty: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
}));
