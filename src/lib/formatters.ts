export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'R$ 0,00';
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}
