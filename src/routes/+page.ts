// src/routes/+page.ts
import { redirect } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';
import { browser } from '$app/environment'; // Import 'browser' dari $app/environment

export async function load({ fetch }) {
	let token = null;
	if (browser) {
		// Periksa apakah kode berjalan di browser
		token = localStorage.getItem('jwt_token');
	}

	if (!token) {
		throw redirect(302, '/auth/login'); // Redirect ke halaman login jika tidak ada token
	}

	// Opsional: Validasi token dengan endpoint /auth/me
	try {
		const response = await fetch(`${API_BASE_URL}/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			if (browser) {
				localStorage.removeItem('jwt_token'); // Hapus token kadaluarsa/tidak valid
			}
			throw redirect(302, '/auth/login');
		}

		// Jika token valid dan respons OK, redirect ke dashboard
		throw redirect(302, '/dashboard');
	} catch (error) {
		console.error('Error fetching user data:', error);
		if (browser) {
			localStorage.removeItem('jwt_token');
		}
		throw redirect(302, '/auth/login');
	}
}
