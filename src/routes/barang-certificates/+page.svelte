<script lang="ts">
  import { onMount } from 'svelte';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';

  type Mitra = { id: number; nama: string };
  type BarangCertificate = {
    id: number;
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
    mitra?: { id: number; nama: string } | null;
    created_at?: string;
    updated_at?: string;
  };

  let items: BarangCertificate[] = [];
  let mitras: Mitra[] = [];
  let loading = true;
  let error = '';
  let search = '';
  let mitraFilter: number | '' = '';
  let currentPage = 1;
  let lastPage = 1;
  let totalItems = 0;

  // Modal state
  let showCreateModal = false;
  let showEditModal = false;
  let editingItem: BarangCertificate | null = null;

  // Drawer state
  let showDetailDrawer = false;
  let selectedItem: BarangCertificate | null = null;
  let activeView: 'table' | 'list' = 'table';

  // Form state
  let form: {
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
  } = {
    name: '',
    no_seri: '',
    mitra_id: ''
  };

  async function fetchDependencies() {
    try {
      const res = await axiosClient.get('/barang-certificates/getFormDependencies');
      mitras = res.data?.data?.mitras ?? res.data?.mitras ?? [];
    } catch (err) {
      // no-op; allow page to still function
      console.error('Failed to fetch dependencies', err);
    }
  }

  async function fetchList() {
    loading = true;
    error = '';
    try {
      const res = await axiosClient.get('/barang-certificates', {
        params: {
          search,
          mitra_id: mitraFilter || undefined,
          page: currentPage
        }
      });
      items = res.data?.data ?? [];
      currentPage = res.data?.pagination?.current_page ?? res.data?.current_page ?? 1;
      lastPage = res.data?.pagination?.last_page ?? res.data?.last_page ?? 1;
      totalItems = res.data?.pagination?.total ?? res.data?.total ?? items.length;
    } catch (err: any) {
      error = err?.response?.data?.message || 'Gagal memuat data.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchDependencies();
    fetchList();
  });

  function handleSearchChange() {
    currentPage = 1;
    fetchList();
  }

  function handleFilterOrSearch() {
    currentPage = 1;
    fetchList();
  }

  function goToPage(page: number) {
    if (page > 0 && page <= lastPage) {
      currentPage = page;
      fetchList();
    }
  }

  function openCreateModal() {
    form = { name: '', no_seri: '', mitra_id: '' };
    showCreateModal = true;
  }

  function openEditModal(item: BarangCertificate) {
    editingItem = { ...item };
    form = {
      name: item.name ?? '',
      no_seri: item.no_seri ?? '',
      mitra_id: item.mitra_id ?? ''
    };
    showEditModal = true;
  }

  function openDetailDrawer(item: BarangCertificate) {
    selectedItem = { ...item };
    showDetailDrawer = true;
  }

  async function handleSubmitCreate() {
    try {
      await axiosClient.post('/barang-certificates', form);
      alert('Data berhasil ditambahkan');
      showCreateModal = false;
      fetchList();
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan data.';
      alert('Error:\n' + messages);
      console.error('Create failed:', err.response || err);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingItem?.id) return;
    try {
      await axiosClient.put(`/barang-certificates/${editingItem.id}`, form);
      alert('Data berhasil diperbarui');
      showEditModal = false;
      fetchList();
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui data.';
      alert('Error:\n' + messages);
      console.error('Update failed:', err.response || err);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await axiosClient.delete(`/barang-certificates/${id}`);
      alert('Data berhasil dihapus');
      fetchList();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
      console.error('Delete failed:', err.response || err);
    }
  }
</script>

<div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
  <div class="flex w-full sm:w-auto space-x-2">
    <select bind:value={mitraFilter} on:change={handleFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
      <option value="">Filter Mitra: Semua</option>
      {#each mitras as m}
        <option value={m.id}>{m.nama}</option>
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
        placeholder="Cari barang certificate..."
        bind:value={search}
        on:input={handleFilterOrSearch}
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  </div>
  <div class="flex space-x-2 w-full sm:w-auto">
    <button
      on:click={openCreateModal}
      class="px-4 py-2 w-full sm:w-auto border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Tambah Barang
    </button>
  </div>
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
</div>

{#if loading}
  <p>Memuat data...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if items.length === 0}
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <ul class="divide-y divide-gray-200">
      <li class="px-4 py-4 sm:px-6">
        <p class="text-sm text-gray-500">Belum ada data.</p>
      </li>
    </ul>
  </div>
{:else}
  {#if activeView === 'list'}
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        {#each items as item (item.id)}
          <li>
            <a href={`/barang-certificates/${item.id}`} class="block hover:bg-gray-50 px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">No. Seri: {item.no_seri} | Mitra: {item.mitra?.nama || '-'}</p>
                </div>
              </div>
            </a>
            <div class="flex justify-end px-4 py-2 sm:px-6 space-x-2">
              <button on:click|stopPropagation={() => openDetailDrawer(item)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200">Detail</button>
              <button on:click|stopPropagation={() => openEditModal(item)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700">Edit</button>
              <button on:click|stopPropagation={() => handleDelete(item.id)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700">Hapus</button>
            </div>
          </li>
        {/each}
      </ul>
      {#if items.length > 0}
        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={goToPage} totalItems={totalItems} itemsPerPage={10} />
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
                Nama
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >No. Seri
            </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Mitra
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each items as item (item.id)}
              <tr>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <a href={`/barang-certificates/${item.id}`} class="text-indigo-600 hover:text-indigo-900">
                    {item.name}
                  </a>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.no_seri}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.mitra?.nama || '-'}
                </td>
                <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                  <div class="flex items-center space-x-2">
                    <button on:click={() => openDetailDrawer(item)} title="Detail" class="text-indigo-600 hover:text-indigo-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span class="sr-only">Detail, {item.name}</span>
                    </button>
                    <button on:click={() => openEditModal(item)} title="Edit" class="text-blue-600 hover:text-blue-900">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span class="sr-only">Edit, {item.name}</span>
                    </button>
                    <button on:click={() => handleDelete(item.id)} title="Hapus" class="text-red-600 hover:text-red-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      <span class="sr-only">Hapus, {item.name}</span>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if items.length > 0}
        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={goToPage} totalItems={totalItems} itemsPerPage={10} />
      {/if}
    </div>
  {/if}
{/if}

<Modal bind:show={showCreateModal} title="Tambah Barang Certificate">
  <form on:submit|preventDefault={handleSubmitCreate} class="space-y-4">
    <div>
      <label for="create_name" class="block text-sm font-medium text-gray-900">Nama</label>
      <input id="create_name" type="text" bind:value={form.name} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
    <div>
      <label for="create_no_seri" class="block text-sm font-medium text-gray-900">No. Seri</label>
      <input id="create_no_seri" type="text" bind:value={form.no_seri} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
    <div>
      <label for="create_mitra" class="block text-sm font-medium text-gray-900">Mitra</label>
      <select id="create_mitra" bind:value={form.mitra_id} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Pilih Mitra (opsional)</option>
        {#each mitras as m}
          <option value={m.id}>{m.nama}</option>
        {/each}
      </select>
    </div>
    <div>
      <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Simpan</button>
    </div>
  </form>
  
</Modal>

<Modal bind:show={showEditModal} title="Edit Barang Certificate">
  {#if editingItem}
    <form on:submit|preventDefault={handleSubmitUpdate} class="space-y-4">
      <div>
        <label for="edit_name" class="block text-sm font-medium text-gray-900">Nama</label>
        <input id="edit_name" type="text" bind:value={form.name} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="edit_no_seri" class="block text-sm font-medium text-gray-900">No. Seri</label>
        <input id="edit_no_seri" type="text" bind:value={form.no_seri} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="edit_mitra" class="block text-sm font-medium text-gray-900">Mitra</label>
        <select id="edit_mitra" bind:value={form.mitra_id} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">Pilih Mitra (opsional)</option>
          {#each mitras as m}
            <option value={m.id}>{m.nama}</option>
          {/each}
        </select>
      </div>
      <div>
        <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Update</button>
      </div>
    </form>
  {/if}
</Modal>

<Drawer 
  bind:show={showDetailDrawer} 
  title="Detail Barang Certificate"
  on:close={() => showDetailDrawer = false}
>
  <BarangCertificatesDetail barangCertificates={selectedItem} />
</Drawer>


