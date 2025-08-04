export function formatCurrency(value) {
    if (typeof value !== 'number') {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
    }).format(value);
}
