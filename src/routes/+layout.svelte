<script lang="ts">
	import '../app.css'; // Pastikan Tailwind CSS diimpor
	import axiosClient from '$lib/axiosClient';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
  
	// Import komponen baru
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TopNav from '$lib/components/TopNav.svelte';
	import MobileSidebar from '$lib/components/Mobilesidebar.svelte';
  
	// State untuk mengontrol sidebar
	let sidebarOpen: boolean = false; // Untuk mobile sidebar
	let sidebarCollapsed: boolean = false; // Untuk desktop sidebar (collapse/expand)
  
	async function logout() {
	  if (confirm('Apakah Anda yakin ingin logout?')) {
		try {
		  await axiosClient.post('/auth/logout');
		  localStorage.removeItem('jwt_token');
		  alert('Logout berhasil!');
		  goto('/auth/login');
		} catch (error) {
		  console.error('Logout failed:', error);
		  localStorage.removeItem('jwt_token');
		  alert('Logout gagal, namun Anda telah keluar dari sesi.');
		  goto('/auth/login');
		}
	  }
	}
  
	// Cek apakah halaman saat ini adalah bagian dari rute autentikasi
	$: isAuthRoute = $page.url.pathname.startsWith('/auth');

	// Function untuk mendapatkan title berdasarkan route
	function getPageTitle(pathname: string): string {
		switch (pathname) {
			case '/dashboard':
				return 'Dashboard';
			case '/projects':
				return 'Daftar Project';
			case '/activities':
				return 'Daftar Activity';
			case '/mitras':
				return 'Daftar Mitra';
			case '/settings':
				return 'Pengaturan';
			default:
				if (pathname.startsWith('/projects/')) return 'Detail Project';
				if (pathname.startsWith('/activities/')) return 'Detail Activity';
				if (pathname.startsWith('/mitras/')) return 'Detail Mitra';
				if (pathname.startsWith('/settings/')) return 'Pengaturan';
				return 'Dashboard';
		}
	}
</script>
  
  {#if isAuthRoute}
	<slot></slot>
  {:else}
	<div class="flex h-screen bg-gray-100 font-sans">
	  <Sidebar
		bind:collapsed={sidebarCollapsed}
		on:toggleCollapsed={() => (sidebarCollapsed = !sidebarCollapsed)}
		on:logout={logout}
	  />
  
	  <div
		class="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
		class:lg:pl-64={!sidebarCollapsed}
		class:lg:pl-20={sidebarCollapsed}
	  >
		<MobileSidebar
		  bind:open={sidebarOpen}
		  on:close={() => (sidebarOpen = false)}
		  on:logout={logout}
		/>
		
		<TopNav on:toggleMobileSidebar={() => (sidebarOpen = true)}>
			<svelte:fragment slot="topnav-title">
				<h1 class="text-2xl font-semibold text-gray-900">{getPageTitle($page.url.pathname)}</h1>
			</svelte:fragment>
		</TopNav>
  
		<main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
		  <div class="mx-auto max-w-7xl">
			<slot></slot> </div>
		</main>
	  </div>
	</div>
  {/if}
  
  <style>
	/* Tidak perlu style tambahan jika menggunakan Tailwind secara ekstensif */
	/* Pastikan `src/app.css` hanya berisi impor Tailwind dan sedikit custom CSS global jika ada */
  </style>