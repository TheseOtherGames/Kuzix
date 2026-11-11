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
