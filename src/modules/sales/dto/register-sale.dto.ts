export interface RegisterSaleDTO {
  companyId: string;
  userId: string;
  sessionId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  payments: {
    method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX";
    amount: number;
  }[];
}
