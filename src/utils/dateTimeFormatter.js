// utils/dateTimeFormatter.js
export const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString(); // Customize the format as needed
};


export const formatDateTime2 = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      // timeZoneName: 'short'
    }).format(date);
  }