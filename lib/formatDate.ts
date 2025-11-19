export function formatDate(date: Date, includeTime = false): string {
    const options: Intl.DateTimeFormatOptions = includeTime
        ? {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
        : {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        };

    return new Intl.DateTimeFormat('de-DE', options).format(date);
}

export default formatDate;
