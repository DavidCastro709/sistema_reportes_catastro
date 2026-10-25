export const money = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value || 0));
export const dateTime = (value) => new Date(value).toLocaleString('es-MX');
