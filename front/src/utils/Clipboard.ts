import { toast } from '@/utils/Toast';

// Copies and confirms with a toast; false when the browser refuses (no permission, insecure page).
export const copyText = async (text: string, success: string, failure?: string): Promise<boolean> => {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(success);

		return true;
	} catch (error) {
		toast.error(failure ?? (error as Error).message);

		return false;
	}
};
