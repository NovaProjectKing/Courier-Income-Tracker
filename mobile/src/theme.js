export const themes = {
  light: {
    mode: 'light',
    background: '#F6F6F2',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEFE9',
    text: '#181918',
    muted: '#777B78',
    line: '#E6E7E1',
    accent: '#FFDB4D',
    accentText: '#201C0A',
    positive: '#17865B',
    danger: '#C64B43',
    shadow: '#152018',
  },
  dark: {
    mode: 'dark',
    background: '#111313',
    surface: '#1C2020',
    surfaceAlt: '#282D2C',
    text: '#F3F4EF',
    muted: '#9A9F9D',
    line: '#303635',
    accent: '#FFDB4D',
    accentText: '#201C0A',
    positive: '#71D7A7',
    danger: '#FF8279',
    shadow: '#000000',
  },
};

export const formatMoney = (amount) =>
  `${new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)} ₽`;

export const formatDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatShortDate = (value) =>
  new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
