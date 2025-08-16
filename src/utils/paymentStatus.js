// Utility for formatting payment status values consistently across the app
export const humanizePaymentStatus = (status) => {
  if (!status) return 'Unknown';
  return String(status)
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
};

export default humanizePaymentStatus;
