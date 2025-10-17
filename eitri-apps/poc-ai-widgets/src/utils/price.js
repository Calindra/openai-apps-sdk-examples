export const formatPrice = (price, divisor = 1) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price / divisor);
};
