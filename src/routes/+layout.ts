import { redirect } from '@sveltejs/kit';

export const ssr = false;
export const prerender = false;

export async function load({ url }) {
	const pathname = url.pathname;
	// Allow auth routes (login, register, forgot, etc.) to load without a token.
	if (pathname.startsWith('/auth')) {
		return {};
	}
	// Access token from localStorage. Note: this only runs client-side because
	// SSR is disabled.
	const token = localStorage.getItem('jwt_token');
	if (!token) {
		// Redirect unauthenticated users to the login page. Use 307 (temporary)
		// to preserve the method.
		throw redirect(307, '/auth/login');
	}
	return {};
}
