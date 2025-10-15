// src/routes/+layout.ts
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config';

export const ssr = false;
export const csr = true;
export const prerender = false;

export async function load({ fetch }) {
	if (!browser) return;

	const token = localStorage.getItem('jwt_token');

	if (!token) {
		throw redirect(302, `/auth/login`);
	}

	try {
		const res = await fetch(`${API_BASE_URL}/auth/me`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) {
			localStorage.removeItem('jwt_token');
			throw redirect(302, `/auth/login`);
		}
		const user = await res.json().catch(() => null);
		return { user };
	} catch {
		localStorage.removeItem('jwt_token');
		throw redirect(302, `/auth/login`);
	}
}

// src/routes/+layout.ts old
// import { redirect } from '@sveltejs/kit';
// import { browser } from '$app/environment';
// import { API_BASE_URL } from '$lib/config';

// export const ssr = false;
// export const prerender = false;

// export async function load({ fetch, url }) {
// 	if (!browser) return;

// 	const path = url.pathname;
// 	const isAuthRoute = path.startsWith('/auth');
// 	const token = localStorage.getItem('jwt_token');

// 	// helper: normalisasi & amankan "next"
// 	const nextParam = url.searchParams.get('next') || '';
// 	const safeNext = (() => {
// 		// hanya izinkan path internal yang diawali "/" dan bukan /auth/*
// 		if (nextParam.startsWith('/') && !nextParam.startsWith('/auth/')) {
// 			return nextParam;
// 		}
// 		return '/dashboard';
// 	})();

// 	if (isAuthRoute) {
// 		if (token) {
// 			try {
// 				const res = await fetch(`${API_BASE_URL}/auth/me`, {
// 					method: 'POST',
// 					headers: { Authorization: `Bearer ${token}` }
// 				});
// 				if (res.ok) {
// 					throw redirect(302, safeNext); // ⬅️ pakai next
// 				} else {
// 					localStorage.removeItem('jwt_token');
// 				}
// 			} catch {
// 				localStorage.removeItem('jwt_token');
// 			}
// 		}
// 		return {};
// 	}

// 	if (!token) {
// 		throw redirect(302, `/auth/login?next=${encodeURIComponent(path + url.search)}`);
// 	}

// 	try {
// 		const res = await fetch(`${API_BASE_URL}/auth/me`, {
// 			method: 'POST',
// 			headers: { Authorization: `Bearer ${token}` }
// 		});
// 		if (!res.ok) {
// 			localStorage.removeItem('jwt_token');
// 			throw redirect(302, `/auth/login?next=${encodeURIComponent(path + url.search)}`);
// 		}
// 		const user = await res.json().catch(() => null);
// 		return { user };
// 	} catch {
// 		localStorage.removeItem('jwt_token');
// 		throw redirect(302, `/auth/login?next=${encodeURIComponent(path + url.search)}`);
// 	}
// }
