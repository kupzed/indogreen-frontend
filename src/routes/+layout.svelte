<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import axiosClient from '$lib/axiosClient';
	import { goto } from '$app/navigation';

	async function logout() {
		if (confirm('Apakah Anda yakin ingin logout?')) {
		try {
			await axiosClient.post('/auth/logout'); // Panggil endpoint logout API
			localStorage.removeItem('jwt_token');
			alert('Logout berhasil!');
			goto('/auth/login');
		} catch (error) {
			console.error('Logout failed:', error);
			// Tetap hapus token di frontend meskipun API error
			localStorage.removeItem('jwt_token');
			alert('Logout gagal, namun Anda telah keluar dari sesi.');
			goto('/auth/login');
		}
		}
	}

	let { children } = $props();
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>

	<footer>
		<p>
			visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
		<button on:click={logout}>Logout</button>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
