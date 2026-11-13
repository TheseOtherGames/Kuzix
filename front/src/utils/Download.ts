export const downloadFile = (filename: string, content: string, type: string): void => {
	const url = URL.createObjectURL(new Blob([content], { type }));
	const link = document.createElement('a');
	link.href = url;
	link.download = `kuzix-${filename}`;
	link.click();
	URL.revokeObjectURL(url);
};

export const slugify = (text: string): string => {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'quiz';
};

// Quotes every cell and defuses spreadsheet formulas, since nicknames come from players.
const csvCell = (value: string | number | boolean | null): string => {
	const text = String(value ?? '');

	return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
};

export const downloadCsv = (filename: string, rows: (string | number | boolean | null)[][]): void => {
	downloadFile(filename, rows.map((row) => row.map(csvCell).join(',')).join('\r\n'), 'text/csv');
};
