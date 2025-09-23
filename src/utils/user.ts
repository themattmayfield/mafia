const USER_ID_KEY = "mafia_userId";

export function getUserId(): string {
	if (typeof window === "undefined") {
		return ""; // SSR safe
	}

	let userId = localStorage.getItem(USER_ID_KEY);

	if (!userId) {
		userId = crypto.randomUUID();
		localStorage.setItem(USER_ID_KEY, userId);
	}

	return userId;
}

export function setUserId(userId: string): void {
	if (typeof window === "undefined") {
		return; // SSR safe
	}

	localStorage.setItem(USER_ID_KEY, userId);
}
