// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
// src/routes/dashboard/+page.ts (atau src/routes/+layout.ts untuk global check)
import { redirect } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

export async function load({ fetch }) {
	const token = localStorage.getItem('jwt_token');

	if (!token) {
		throw redirect(302, '/login'); // Redirect ke halaman login jika tidak ada token
	}

	// Opsional: Validasi token dengan endpoint /auth/me
	try {
		const response = await fetch(`${API_BASE_URL}/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			localStorage.removeItem('jwt_token'); // Hapus token kadaluarsa/tidak valid
			throw redirect(302, '/login');
		}

		const user = await response.json();
		return { user }; // Sediakan data user ke komponen
	} catch (error) {
		console.error('Error fetching user data:', error);
		localStorage.removeItem('jwt_token');
		throw redirect(302, '/login');
	}
}

export const prerender = true;
