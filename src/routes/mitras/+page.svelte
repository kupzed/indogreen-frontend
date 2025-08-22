<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import MitraDetail from '$lib/components/detail/MitraDetail.svelte'; 
  import Pagination from '$lib/components/Pagination.svelte';

  let mitras: any[] = [];
  let loading = true;
  let error = '';
  let search: string = '';
  let kategoriFilter: string = ''; // 'pribadi', 'perusahaan', 'customer', 'vendor'
  let dateFromFilter: string = '';
  let dateToFilter: string = '';
  let showDateFilter: boolean = false;
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalMitras: number = 0;

  // State untuk toggle tampilan
  let activeView: 'table' | 'list' = 'table';

  // Modal state for Create/Update
  let showCreateModal: boolean = false;
  let showEditModal: boolean = false;
  let editingMitra: any = null; // Data mitra yang sedang diedit
  
  // Drawer state for mitra detail
  let showDetailDrawer: boolean = false;
  let selectedMitra: any = null; // Data mitra yang dipilih untuk detail

  // Form data for Create/Update
  let form = {
    nama: '',
    is_pribadi: false,
    is_perusahaan: false,
    is_customer: false,
    is_vendor: false,
    alamat: '',
    website: '',
    email: '',
    kontak_1: '',
    kontak_1_nama: '',
    kontak_1_jabatan: '',
    kontak_2: '',
    kontak_2_nama: '',
    kontak_2_jabatan: '',
  };

  const mitraKategoriOptions = ['pribadi', 'perusahaan', 'customer', 'vendor'];

  async function fetchMitras() {
    loading = true;
    error = '';
    try {
      const response = await axiosClient.get('/mitras', {
        params: {
          search: search,
          kategori: kategoriFilter,
          date_from: dateFromFilter,
          date_to: dateToFilter,
          page: currentPage
        }
      });
      mitras = response.data.data;
      currentPage = response.data.pagination.current_page;
      lastPage = response.data.pagination.last_page;
      totalMitras = response.data.pagination.total;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal memuat mitra.';
      console.error('Error fetching mitras:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchMitras();
    
    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function handleFilterOrSearch() {
    currentPage = 1; // Reset halaman saat filter/search berubah
    fetchMitras();
  }

  function clearFilters() {
    search = '';
    kategoriFilter = '';
    dateFromFilter = '';
    dateToFilter = '';
    showDateFilter = false;
    currentPage = 1;
    fetchMitras();
  }

  function toggleDateFilter() {
    showDateFilter = !showDateFilter;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-filter-dropdown') && !target.closest('.date-filter-button')) {
      showDateFilter = false;
    }
  }

  function goToPage(page: number) {
    if (page > 0 && page <= lastPage) {
      currentPage = page;
      fetchMitras();
    }
  }

  function openCreateModal() {
    // Reset form for new mitra
    form = {
      nama: '',
      is_pribadi: false,
      is_perusahaan: false,
      is_customer: false,
      is_vendor: false,
      alamat: '',
      website: '',
      email: '',
      kontak_1: '',
      kontak_1_nama: '',
      kontak_1_jabatan: '',
      kontak_2: '',
      kontak_2_nama: '',
      kontak_2_jabatan: '',
    };
    showCreateModal = true;
  }

  function openEditModal(mitra: any) {
    editingMitra = { ...mitra }; // Copy data to avoid direct mutation
    form = { ...editingMitra }; // Set form data
    showEditModal = true;
  }

  function openDetailDrawer(mitra: any) {
    selectedMitra = { ...mitra };
    showDetailDrawer = true;
  }

  async function handleSubmitCreate() {
    try {
      await axiosClient.post('/mitras', form);
      alert('Mitra berhasil ditambahkan!');
      goto(`/mitras`);
      showCreateModal = false;
      fetchMitras(); // Refresh list
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan mitra.';
      alert('Error:\n' + messages);
      console.error('Create mitra failed:', err.response || err);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingMitra?.id) return;
    try {
      await axiosClient.put(`/mitras/${editingMitra.id}`, form);
      alert('Mitra berhasil diperbarui!');
      goto(`/mitras`);
      showEditModal = false;
      fetchMitras(); // Refresh list
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui mitra.';
      alert('Error:\n' + messages);
      console.error('Update mitra failed:', err.response || err);
    }
  }

  async function handleDelete(mitraId: number) {
    if (confirm('Apakah Anda yakin ingin menghapus mitra ini?')) {
      try {
        await axiosClient.delete(`/mitras/${mitraId}`);
        alert('Mitra berhasil dihapus!');
        goto(`/mitras`);
        fetchMitras(); // Refresh list
      } catch (err: any) {
        alert('Gagal menghapus mitra: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete mitra failed:', err.response || err);
      }
    }
  }

  // Helper for badge colors
  function getKategoriBadgeColor(kategori: string) {
    switch (kategori) {
      case 'Pribadi': return 'bg-indigo-600';
      case 'Perusahaan': return 'bg-indigo-600';
      case 'Customer': return 'bg-indigo-600';
      case 'Vendor': return 'bg-indigo-600';
      default: return 'bg-gray-500';
    }
  }
</script>

<svelte:head>
  <title>Daftar Mitra - Indogreen</title>
</svelte:head>

<div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
  <div class="flex w-full sm:w-auto space-x-2">
    <select bind:value={kategoriFilter} on:change={handleFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
      <option value="">Filter Kategori: Semua</option>
      {#each mitraKategoriOptions as kategori}
        <option value={kategori}>{kategori.charAt(0).toUpperCase() + kategori.slice(1)}</option>
      {/each}
    </select>
  </div>
  <div class="w-full sm:w-auto flex-grow">
    <div class="relative w-full sm:w-auto">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Cari mitra..."
        bind:value={search}
        on:input={handleFilterOrSearch}
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  </div>
  <button
    on:click={openCreateModal}
    class="px-4 py-2 w-full sm:w-auto border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    Tambah Mitra
  </button>
</div>

<div class="flex items-center justify-between mb-4">
  <div class="p-1 bg-gray-200 rounded-lg inline-flex" role="tablist">
    <button
      on:click={() => (activeView = 'table')}
      class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
      class:bg-white={activeView === 'table'}
      class:shadow={activeView === 'table'}
      class:text-gray-600={activeView !== 'table'}
      role="tab"
      aria-selected={activeView === 'table'}
    >
      Table
    </button>
    <button
      on:click={() => (activeView = 'list')}
      class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
      class:bg-white={activeView === 'list'}
      class:shadow={activeView === 'list'}
      class:text-gray-600={activeView !== 'list'}
      role="tab"
      aria-selected={activeView === 'list'}
    >
      Simple
    </button>
  </div>
  
  <div class="relative">
    <button
      on:click={toggleDateFilter}
      class="date-filter-button px-3 py-2 rounded-md text-sm font-semibold border hover:bg-gray-50 flex items-center space-x-1 transition-colors"
      class:bg-indigo-50={dateFromFilter || dateToFilter}
      class:border-indigo-300={dateFromFilter || dateToFilter}
      class:text-indigo-700={dateFromFilter || dateToFilter}
      class:bg-white={!dateFromFilter && !dateToFilter}
      class:border-gray-300={!dateFromFilter && !dateToFilter}
      class:text-gray-900={!dateFromFilter && !dateToFilter}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
      <span>Filter Tanggal</span>
      {#if dateFromFilter || dateToFilter}
        <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
      {/if}
      <svg class="w-4 h-4 transition-transform" class:rotate-180={showDateFilter} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
    
    {#if showDateFilter}
      <div 
        class="date-filter-dropdown absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4"
      >
        <div class="space-y-3">
          {#if dateFromFilter || dateToFilter}
            <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {#if dateFromFilter && dateToFilter}
                Filter: {new Date(dateFromFilter).toLocaleDateString('id-ID')} - {new Date(dateToFilter).toLocaleDateString('id-ID')}
              {:else if dateFromFilter}
                Dari: {new Date(dateFromFilter).toLocaleDateString('id-ID')}
              {:else if dateToFilter}
                Sampai: {new Date(dateToFilter).toLocaleDateString('id-ID')}
              {/if}
            </div>
          {/if}
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              bind:value={dateFromFilter}
              on:change={handleFilterOrSearch}
              class="w-full px-3 py-2 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              bind:value={dateToFilter}
              on:change={handleFilterOrSearch}
              class="w-full px-3 py-2 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div class="flex space-x-2 pt-2">
            <button
              on:click={clearFilters}
              class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear All
            </button>
            <button
              on:click={() => { showDateFilter = false; }}
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if loading}
  <p>Memuat mitra...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if mitras.length === 0}
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <ul class="divide-y divide-gray-200">
      <li class="px-4 py-4 sm:px-6">
        <p class="text-sm text-gray-500">Belum ada mitra. </p>
      </li>
    </ul>
  </div>
{:else}
  {#if activeView === 'list'}
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        {#each mitras as mitra (mitra.id)}
          <li>
            <a href={`/mitras/${mitra.id}`} class="block hover:bg-gray-50 px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-indigo-600 truncate">
                  {mitra.nama}
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  {#if mitra.is_pribadi}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Pribadi')} text-white mr-1">Pribadi</span>{/if}
                  {#if mitra.is_perusahaan}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Perusahaan')} text-white mr-1">Perusahaan</span>{/if}
                  {#if mitra.is_customer}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Customer')} text-white mr-1">Customer</span>{/if}
                  {#if mitra.is_vendor}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Vendor')} text-white mr-1">Vendor</span>{/if}
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">
                    {mitra.alamat.substring(0, 100)}{mitra.alamat.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  <p>
                    Email: {mitra.email}
                  </p>
                </div>
              </div>
            </a>
            <div class="flex justify-end px-4 py-2 sm:px-6 space-x-2">
              <button 
                on:click|stopPropagation={() => openDetailDrawer(mitra)} 
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700">
                Detail
              </button>
              <button
                on:click|stopPropagation={() => openEditModal(mitra)}
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
              <button
                on:click|stopPropagation={() => handleDelete(mitra.id)}
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Hapus
              </button>
            </div>
          </li>
        {/each}
      </ul>
      {#if mitras.length > 0}
        <Pagination 
          currentPage={currentPage} 
          lastPage={lastPage} 
          onPageChange={goToPage} 
          totalItems={totalMitras} 
          itemsPerPage={10} 
        />
      {/if}
    </div>
  {/if}

  {#if activeView === 'table'}
    <div class="mt-4 bg-white shadow-md rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Nama Mitra
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Alamat
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Kategori
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Kontak
              </th>
              <th scope="col" class="relative px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each mitras as mitra (mitra.id)}
              <tr>
                <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                  <a href={`/mitras/${mitra.id}`} class="text-indigo-600 hover:text-indigo-900" title="Detail">
                    {mitra.nama}
                  </a>
                  <br>
                  <span class="text-xs text-gray-500">{mitra.email || '(email belum ditambahkan)'}</span>
                </td>
                <td class="px-3 py-4 text-sm text-gray-500">
                  <div class="max-w-xs truncate">
                    {mitra.alamat.substring(0, 40)}{mitra.alamat.length > 40 ? '...' : ''}
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div class="flex flex-wrap mt-1 gap-1">
                    {#if mitra.is_pribadi}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Pribadi')} text-white">Pribadi</span>{/if}
                    {#if mitra.is_perusahaan}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Perusahaan')} text-white">Perusahaan</span>{/if}
                    {#if mitra.is_customer}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Customer')} text-white">Customer</span>{/if}
                    {#if mitra.is_vendor}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Vendor')} text-white">Vendor</span>{/if}
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {#if mitra.kontak_1}
                    {mitra.kontak_1 || '-'}
                    {#if mitra.kontak_1_nama}
                      <br><span class="text-xs text-gray-400">({mitra.kontak_1_nama || '-'})</span>
                    {:else}
                      -
                    {/if}
                  {:else}
                    -
                  {/if}
                </td>
                <td class="relative whitespace-nowrap px-3 py-4 text-left text-sm font-medium">
                  <div class="flex items-left space-x-2">
                    <button on:click={() => openDetailDrawer(mitra)} class="text-yellow-600 hover:text-yellow-900" title="Detail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span class="sr-only">Detail, {mitra.nama}</span>
                    </button>
                    <button on:click|stopPropagation={() => openEditModal(mitra)} title="Edit" class="text-blue-600 hover:text-blue-900">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
                      <span class="sr-only">Edit, {mitra.nama}</span>
                    </button>
                    <button on:click|stopPropagation={() => handleDelete(mitra.id)} title="Delete" class="text-red-600 hover:text-red-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      <span class="sr-only">Hapus, {mitra.nama}</span>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if mitras.length > 0}
        <Pagination 
          currentPage={currentPage} 
          lastPage={lastPage} 
          onPageChange={goToPage} 
          totalItems={totalMitras} 
          itemsPerPage={10} 
        />
      {/if}
    </div>
  {/if}
{/if}

<Modal bind:show={showCreateModal} title="Tambah Mitra" maxWidth="max-w-xl">
  <form on:submit|preventDefault={handleSubmitCreate}>
    <div class="space-y-4">
      <div>
        <label for="create_nama" class="block text-sm/6 font-medium text-gray-900">Nama</label>
        <div class="mt-2">
          <input type="text" id="create_nama" bind:value={form.nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm/6 font-medium text-gray-900">Kategori</label>
        <div class="flex flex-wrap gap-4 mt-2">
          <label><input type="checkbox" bind:checked={form.is_pribadi} class="mr-1"> Pribadi</label>
          <label><input type="checkbox" bind:checked={form.is_perusahaan} class="mr-1"> Perusahaan</label>
          <label><input type="checkbox" bind:checked={form.is_customer} class="mr-1"> Customer</label>
          <label><input type="checkbox" bind:checked={form.is_vendor} class="mr-1"> Vendor</label>
        </div>
      </div>
      <div>
        <label for="create_alamat" class="block text-sm/6 font-medium text-gray-900">Alamat</label>
        <div class="mt-2">
          <textarea id="create_alamat" bind:value={form.alamat} rows="2" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
        </div>
      </div>
      <div>
        <label for="create_website" class="block text-sm/6 font-medium text-gray-900">Website</label>
        <div class="mt-2">
          <input type="text" id="create_website" bind:value={form.website} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_email" class="block text-sm/6 font-medium text-gray-900">Email</label>
        <div class="mt-2">
          <input type="email" id="create_email" bind:value={form.email} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_1" class="block text-sm/6 font-medium text-gray-900">Kontak 1 (No. Telp/HP)</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_1" bind:value={form.kontak_1} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 1</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_1_nama" bind:value={form.kontak_1_nama} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 1</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_1_jabatan" bind:value={form.kontak_1_jabatan} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_2" class="block text-sm/6 font-medium text-gray-900">Kontak 2 (No. Telp/HP)</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_2" bind:value={form.kontak_2} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_2_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 2</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_2_nama" bind:value={form.kontak_2_nama} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_2_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 2</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_2_jabatan" bind:value={form.kontak_2_jabatan} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
    </div>
    <div class="mt-6">
      <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Tambah Mitra
      </button>
    </div>
  </form>
</Modal>

<Modal bind:show={showEditModal} title="Edit Mitra" maxWidth="max-w-xl">
  {#if editingMitra}
    <form on:submit|preventDefault={handleSubmitUpdate}>
      <div class="space-y-4">
        <div>
          <label for="edit_nama" class="block text-sm/6 font-medium text-gray-900">Nama</label>
          <div class="mt-2">
            <input type="text" id="edit_nama" bind:value={form.nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm/6 font-medium text-gray-900">Kategori</label>
          <div class="flex flex-wrap gap-4 mt-2">
            <label><input type="checkbox" bind:checked={form.is_pribadi} class="mr-1"> Pribadi</label>
            <label><input type="checkbox" bind:checked={form.is_perusahaan} class="mr-1"> Perusahaan</label>
            <label><input type="checkbox" bind:checked={form.is_customer} class="mr-1"> Customer</label>
            <label><input type="checkbox" bind:checked={form.is_vendor} class="mr-1"> Vendor</label>
          </div>
        </div>
        <div>
          <label for="edit_alamat" class="block text-sm/6 font-medium text-gray-900">Alamat</label>
          <div class="mt-2">
            <textarea id="edit_alamat" bind:value={form.alamat} rows="2" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="edit_website" class="block text-sm/6 font-medium text-gray-900">Website</label>
          <div class="mt-2">
            <input type="text" id="edit_website" bind:value={form.website} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_email" class="block text-sm/6 font-medium text-gray-900">Email</label>
          <div class="mt-2">
            <input type="email" id="edit_email" bind:value={form.email} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_1" class="block text-sm/6 font-medium text-gray-900">Kontak 1 (No. Telp/HP)</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_1" bind:value={form.kontak_1} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 1</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_1_nama" bind:value={form.kontak_1_nama} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 1</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_1_jabatan" bind:value={form.kontak_1_jabatan} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_2" class="block text-sm/6 font-medium text-gray-900">Kontak 2 (No. Telp/HP)</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_2" bind:value={form.kontak_2} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_2_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 2</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_2_nama" bind:value={form.kontak_2_nama} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_2_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 2</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_2_jabatan" bind:value={form.kontak_2_jabatan} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
      </div>
      <div class="mt-6">
        <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Update Mitra
        </button>
      </div>
    </form>
  {/if}
</Modal>

<!-- Mitra Detail Drawer -->
<Drawer 
  bind:show={showDetailDrawer} 
  title="Detail Mitra"
  on:close={() => showDetailDrawer = false}
>
  <MitraDetail mitra={selectedMitra} />
</Drawer>