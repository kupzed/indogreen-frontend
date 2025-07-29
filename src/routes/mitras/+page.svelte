<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';

  let mitras: any[] = [];
  let loading = true;
  let error = '';
  let search: string = '';
  let kategoriFilter: string = ''; // 'pribadi', 'perusahaan', 'customer', 'vendor'
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalMitras: number = 0;

  // Modal state for Create/Update
  let showCreateModal: boolean = false;
  let showEditModal: boolean = false;
  let editingMitra: any = null; // Data mitra yang sedang diedit

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
  });

  function handleFilterOrSearch() {
    currentPage = 1; // Reset halaman saat filter/search berubah
    fetchMitras();
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
      case 'Pribadi': return 'bg-red-900';
      case 'Perusahaan': return 'bg-green-900';
      case 'Customer': return 'bg-blue-900';
      case 'Vendor': return 'bg-gray-900';
      default: return 'bg-gray-500';
    }
  }
</script>


<div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
  <div class="flex w-full sm:w-auto space-x-2">
    <button
      on:click={() => { kategoriFilter = ''; handleFilterOrSearch(); }}
      class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold {kategoriFilter === '' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}"
    >
      Semua Kategori
    </button>
    {#each mitraKategoriOptions as kategori}
      <button
        on:click={() => { kategoriFilter = kategori; handleFilterOrSearch(); }}
        class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold {kategoriFilter === kategori ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}"
      >
        {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
      </button>
    {/each}
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

    <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div class="flex flex-1 justify-between sm:hidden">
        <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">Previous</button>
        <button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage} class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 {currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : ''}">Next</button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing
            <span class="font-medium">{(currentPage - 1) * 10 + 1}</span>
            to
            <span class="font-medium">{(currentPage - 1) * 10 + mitras.length}</span>
            of
            <span class="font-medium">{totalMitras}</span>
            results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
            <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
              <span class="sr-only">Previous</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
              </svg>
            </button>
            {#each Array(lastPage).fill(0) as _, i}
              {@const pageNum = i + 1}
              <button
                on:click={() => goToPage(pageNum)}
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum === currentPage ? 'z-10 bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50'} focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                aria-current={pageNum === currentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            {/each}
            <button on:click={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage} class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 {currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : ''}">
              <span class="sr-only">Next</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
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
          <input type="email" id="create_email" bind:value={form.email} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_1" class="block text-sm/6 font-medium text-gray-900">Kontak 1 (No. Telp/HP)</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_1" bind:value={form.kontak_1} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 1</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_1_nama" bind:value={form.kontak_1_nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 1</label>
        <div class="mt-2">
          <input type="text" id="create_kontak_1_jabatan" bind:value={form.kontak_1_jabatan} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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
            <input type="email" id="edit_email" bind:value={form.email} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_1" class="block text-sm/6 font-medium text-gray-900">Kontak 1 (No. Telp/HP)</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_1" bind:value={form.kontak_1} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 1</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_1_nama" bind:value={form.kontak_1_nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 1</label>
          <div class="mt-2">
            <input type="text" id="edit_kontak_1_jabatan" bind:value={form.kontak_1_jabatan} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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