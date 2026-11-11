export class HttpError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

export const assert: (condition: unknown, message: string, status?: number) => asserts condition = (condition, message, status = 400) => {
	if (!condition) {
		throw new HttpError(status, message);
	}
};

export const isUniqueViolation = (error: unknown): boolean => {
	return (error as { code?: string })?.code === '23505';
};
