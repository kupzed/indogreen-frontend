<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';
  import MitraDetail from '$lib/components/detail/MitraDetail.svelte';

  let mitraId: string | null = null;
  let mitra: any = null;
  let loadingMitra = true;
  let errorMitra = '';

  // Modal state for Update
  let showEditModal: boolean = false;

  // Form data for Update
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

  let editingMitra: any = true;

  const mitraKategoriOptions = ['Pribadi', 'Perusahaan', 'Customer', 'Vendor'];

  // Tabs state
  let activeTab: 'detail' | 'barang' = 'detail';

  // Barang Certificates (per mitra)
  type BarangCertificate = {
    id: number;
    name: string;
    no_seri: string;
    mitra_id: number | '' | null;
    mitra?: { id: number; nama: string } | null;
    created_at?: string;
    updated_at?: string;
  };

  let bcItems: BarangCertificate[] = [];
  let bcLoading = false;
  let bcError = '';
  let bcSearch = '';
  let bcCurrentPage = 1;
  let bcLastPage = 1;
  let bcTotalItems = 0;
  let bcInitialized = false;

  // Barang Certificates: modal and drawer state
  let bcShowCreateModal = false;
  let bcShowEditModal = false;
  let bcEditingItem: BarangCertificate | null = null;
  let bcShowDetailDrawer = false;
  let bcSelectedItem: BarangCertificate | null = null;
  let bcActiveView: 'table' | 'list' = 'table';

  // Barang Certificates: form state
  let bcForm: { name: string; no_seri: string; mitra_id: number | '' | null } = {
    name: '',
    no_seri: '',
    mitra_id: ''
  };

  async function fetchMitraDetails() {
    loadingMitra = true;
    errorMitra = '';
    mitraId = $page.params.id;
    if (!mitraId) {
      errorMitra = 'Mitra ID tidak ditemukan.';
      loadingMitra = false;
      return;
    }
    try {
      const response = await axiosClient.get(`/mitras/${mitraId}`);
      mitra = response.data.data;

      // Pre-fill edit mitra form
      form = { ...mitra };

    } catch (err: any) {
      errorMitra = err.response?.data?.message || 'Gagal memuat detail mitra.';
      console.error('Error fetching mitra details:', err.response || err);
    } finally {
      loadingMitra = false;
    }
  }

  onMount(() => {
    fetchMitraDetails();
  });

  function openEditModal() {
    showEditModal = true;
  }

  async function handleSubmitUpdate() {
    if (!mitra?.id) return;
    try {
      await axiosClient.put(`/mitras/${mitra.id}`, form);
      alert('Mitra berhasil diperbarui!');
      goto(`/mitras/${mitra.id}`);
      showEditModal = false;
      fetchMitraDetails(); // Refresh details
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui mitra.';
      alert('Error:\n' + messages);
      console.error('Update mitra failed:', err.response || err);
    }
  }

  async function handleDelete() {
    if (!mitra?.id) return;
    if (confirm('Apakah Anda yakin ingin menghapus mitra ini?')) {
      try {
        await axiosClient.delete(`/mitras/${mitra.id}`);
        alert('Mitra berhasil dihapus!');
        goto('/mitras'); // Redirect to mitra list
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

  // ===== Barang Certificates handlers (filtered by this mitra) =====
  async function fetchBarangCertificates() {
    if (!mitra?.id) return;
    bcLoading = true;
    bcError = '';
    try {
      const res = await axiosClient.get('/barang-certificates', {
        params: {
          search: bcSearch,
          mitra_id: mitra.id,
          page: bcCurrentPage
        }
      });
      bcItems = res.data?.data ?? [];
      bcCurrentPage = res.data?.pagination?.current_page ?? res.data?.current_page ?? 1;
      bcLastPage = res.data?.pagination?.last_page ?? res.data?.last_page ?? 1;
      bcTotalItems = res.data?.pagination?.total ?? res.data?.total ?? bcItems.length;
    } catch (err: any) {
      bcError = err?.response?.data?.message || 'Gagal memuat data.';
      console.error('Error fetching barang certificates:', err?.response || err);
    } finally {
      bcLoading = false;
    }
  }

  function bcHandleSearchChange() {
    bcCurrentPage = 1;
    fetchBarangCertificates();
  }

  function bcGoToPage(page: number) {
    if (page > 0 && page <= bcLastPage) {
      bcCurrentPage = page;
      fetchBarangCertificates();
    }
  }

  function bcOpenCreateModal() {
    if (!mitra?.id) return;
    bcForm = { name: '', no_seri: '', mitra_id: mitra.id };
    bcShowCreateModal = true;
  }

  function bcOpenEditModal(item: BarangCertificate) {
    bcEditingItem = { ...item };
    bcForm = {
      name: item.name ?? '',
      no_seri: item.no_seri ?? '',
      mitra_id: mitra?.id ?? ''
    };
    bcShowEditModal = true;
  }

  function bcOpenDetailDrawer(item: BarangCertificate) {
    bcSelectedItem = { ...item };
    bcShowDetailDrawer = true;
  }

  async function bcHandleSubmitCreate() {
    try {
      // Force assign current mitra
      if (mitra?.id) bcForm.mitra_id = mitra.id;
      await axiosClient.post('/barang-certificates', bcForm);
      alert('Data berhasil ditambahkan');
      bcShowCreateModal = false;
      fetchBarangCertificates();
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan data.';
      alert('Error:\n' + messages);
      console.error('Create failed:', err.response || err);
    }
  }

  async function bcHandleSubmitUpdate() {
    if (!bcEditingItem?.id) return;
    try {
      if (mitra?.id) bcForm.mitra_id = mitra.id;
      await axiosClient.put(`/barang-certificates/${bcEditingItem.id}`, bcForm);
      alert('Data berhasil diperbarui');
      bcShowEditModal = false;
      fetchBarangCertificates();
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui data.';
      alert('Error:\n' + messages);
      console.error('Update failed:', err.response || err);
    }
  }

  async function bcHandleDelete(id: number) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await axiosClient.delete(`/barang-certificates/${id}`);
      alert('Data berhasil dihapus');
      fetchBarangCertificates();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
      console.error('Delete failed:', err.response || err);
    }
  }

  // First-time load when switching to barang tab
  $: if (activeTab === 'barang' && mitra?.id && !bcInitialized) {
    bcInitialized = true;
    fetchBarangCertificates();
  }
</script>


{#if loadingMitra}
  <p>Memuat detail mitra...</p>
{:else if errorMitra}
  <p class="text-red-500">{errorMitra}</p>
{:else if mitra}
  <div class="max-w-1xl mx-auto mb-8">
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-2xl">
          {mitra.nama}
        </h2>
        <div class="my-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="my-2 flex items-center text-sm text-gray-500">
            {#if mitra.is_pribadi}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Pribadi')} text-white mr-1">Pribadi</span>{/if}
            {#if mitra.is_perusahaan}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Perusahaan')} text-white mr-1">Perusahaan</span>{/if}
            {#if mitra.is_customer}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Customer')} text-white mr-1">Customer</span>{/if}
            {#if mitra.is_vendor}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Vendor')} text-white mr-1">Vendor</span>{/if}
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 mb-4 md:mt-0 md:ml-4 md:mb-4 space-y-2 md:space-y-0 md:space-x-4">
        <button
          on:click={openEditModal}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit Mitra
        </button>
        <button
          on:click={handleDelete}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Hapus Mitra
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex items-center justify-between mb-4">
      <div class="p-1 bg-gray-200 rounded-lg inline-flex" role="tablist">
        <button
          on:click={() => (activeTab = 'detail')}
          class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
          class:bg-white={activeTab === 'detail'}
          class:shadow={activeTab === 'detail'}
          class:text-gray-600={activeTab !== 'detail'}
          role="tab"
          aria-selected={activeTab === 'detail'}
        >
          Detail
        </button>
        <button
          on:click={() => (activeTab = 'barang')}
          class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
          class:bg-white={activeTab === 'barang'}
          class:shadow={activeTab === 'barang'}
          class:text-gray-600={activeTab !== 'barang'}
          role="tab"
          aria-selected={activeTab === 'barang'}
        >
          Barang
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    {#if activeTab === 'detail'}
      <div class="bg-white shadow overflow-hidden">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Mitra</h3>
        </div>
        <div class="border-t border-gray-200">
          <MitraDetail mitra={mitra} />
        </div>
      </div>
    {/if}

    {#if activeTab === 'barang'}
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
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
                bind:value={bcSearch}
                on:input={bcHandleSearchChange}
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div class="flex space-x-2 w-full sm:w-auto">
            <button
              on:click={bcOpenCreateModal}
              class="px-4 py-2 w-full sm:w-auto border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Tambah Barang
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="p-1 bg-gray-200 rounded-lg inline-flex" role="tablist">
            <button
              on:click={() => (bcActiveView = 'table')}
              class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
              class:bg-white={bcActiveView === 'table'}
              class:shadow={bcActiveView === 'table'}
              class:text-gray-600={bcActiveView !== 'table'}
              role="tab"
              aria-selected={bcActiveView === 'table'}
            >
              Table
            </button>
            <button
              on:click={() => (bcActiveView = 'list')}
              class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
              class:bg-white={bcActiveView === 'list'}
              class:shadow={bcActiveView === 'list'}
              class:text-gray-600={bcActiveView !== 'list'}
              role="tab"
              aria-selected={bcActiveView === 'list'}
            >
              Simple
            </button>
          </div>
        </div>

        {#if bcLoading}
          <p>Memuat data...</p>
        {:else if bcError}
          <p class="text-red-500">{bcError}</p>
        {:else if bcItems.length === 0}
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              <li class="px-4 py-4 sm:px-6">
                <p class="text-sm text-gray-500">Belum ada data.</p>
              </li>
            </ul>
          </div>
        {:else}
          {#if bcActiveView === 'list'}
            <div class="bg-white shadow overflow-hidden sm:rounded-md">
              <ul class="divide-y divide-gray-200">
                {#each bcItems as item (item.id)}
                  <li>
                    <a href={`/barang-certificates/${item.id}`} class="block hover:bg-gray-50 px-4 py-4 sm:px-6">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                      </div>
                      <div class="mt-2 sm:flex sm:justify-between">
                        <div class="sm:flex">
                          <p class="flex items-center text-sm text-gray-500">No. Seri: {item.no_seri} | Mitra: {mitra.nama}</p>
                        </div>
                      </div>
                    </a>
                    <div class="flex justify-end px-4 py-2 sm:px-6 space-x-2">
                      <button on:click|stopPropagation={() => bcOpenDetailDrawer(item)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700">Detail</button>
                      <button on:click|stopPropagation={() => bcOpenEditModal(item)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700">Edit</button>
                      <button on:click|stopPropagation={() => bcHandleDelete(item.id)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700">Hapus</button>
                    </div>
                  </li>
                {/each}
              </ul>
              {#if bcItems.length > 0}
                <Pagination currentPage={bcCurrentPage} lastPage={bcLastPage} onPageChange={bcGoToPage} totalItems={bcTotalItems} itemsPerPage={10} />
              {/if}
            </div>
          {/if}

          {#if bcActiveView === 'table'}
            <div class="mt-4 bg-white shadow-md rounded-lg">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-300">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nama Barang</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">No. Seri</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Mitra</th>
                      <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    {#each bcItems as item (item.id)}
                      <tr>
                        <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          <a href={`/barang-certificates/${item.id}`} class="text-indigo-600 hover:text-indigo-900">{item.name}</a>
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.no_seri}</td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{mitra.nama}</td>
                        <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                          <div class="flex items-center space-x-2">
                            <button on:click={() => bcOpenDetailDrawer(item)} title="Detail" class="text-yellow-600 hover:text-yellow-900">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              <span class="sr-only">Detail, {item.name}</span>
                            </button>
                            <button on:click={() => bcOpenEditModal(item)} title="Edit" class="text-blue-600 hover:text-blue-900">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              <span class="sr-only">Edit, {item.name}</span>
                            </button>
                            <button on:click={() => bcHandleDelete(item.id)} title="Hapus" class="text-red-600 hover:text-red-900">
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
              {#if bcItems.length > 0}
                <Pagination
                  currentPage={bcCurrentPage}
                  lastPage={bcLastPage}
                  onPageChange={bcGoToPage}
                  totalItems={bcTotalItems}
                  itemsPerPage={10}
                />
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
{/if}

  <Modal bind:show={showEditModal} title="Edit Mitra" maxWidth="max-w-xl">
    {#if mitra}
      <form on:submit|preventDefault={handleSubmitUpdate}>
        <div class="space-y-4">
          <div>
            <label for="edit_mitra_nama" class="block text-sm/6 font-medium text-gray-900">Nama</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_nama" bind:value={form.nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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
            <label for="edit_mitra_alamat" class="block text-sm/6 font-medium text-gray-900">Alamat</label>
            <div class="mt-2">
              <textarea id="edit_mitra_alamat" bind:value={form.alamat} rows="2" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
            </div>
          </div>
          <div>
            <label for="edit_mitra_website" class="block text-sm/6 font-medium text-gray-900">Website</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_website" bind:value={form.website} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_email" class="block text-sm/6 font-medium text-gray-900">Email</label>
            <div class="mt-2">
              <input type="email" id="edit_mitra_email" bind:value={form.email} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_1" class="block text-sm/6 font-medium text-gray-900">Kontak 1 (No. Telp/HP)</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_1" bind:value={form.kontak_1} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 1</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_1_nama" bind:value={form.kontak_1_nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 1</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_1_jabatan" bind:value={form.kontak_1_jabatan} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_2" class="block text-sm/6 font-medium text-gray-900">Kontak 2 (No. Telp/HP)</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_2" bind:value={form.kontak_2} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_2_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 2</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_2_nama" bind:value={form.kontak_2_nama} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_2_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 2</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_2_jabatan" bind:value={form.kontak_2_jabatan} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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

  <!-- Barang Certificates: Create Modal -->
  <Modal bind:show={bcShowCreateModal} title="Tambah Barang Certificate">
    <form on:submit|preventDefault={bcHandleSubmitCreate} class="space-y-4">
      <div>
        <label for="bc_create_name" class="block text-sm font-medium text-gray-900">Nama</label>
        <input id="bc_create_name" type="text" bind:value={bcForm.name} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="bc_create_no_seri" class="block text-sm font-medium text-gray-900">No. Seri</label>
        <input id="bc_create_no_seri" type="text" bind:value={bcForm.no_seri} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Simpan</button>
      </div>
    </form>
  </Modal>

  <!-- Barang Certificates: Edit Modal -->
  <Modal bind:show={bcShowEditModal} title="Edit Barang Certificate">
    {#if bcEditingItem}
      <form on:submit|preventDefault={bcHandleSubmitUpdate} class="space-y-4">
        <div>
          <label for="bc_edit_name" class="block text-sm font-medium text-gray-900">Nama</label>
          <input id="bc_edit_name" type="text" bind:value={bcForm.name} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label for="bc_edit_no_seri" class="block text-sm font-medium text-gray-900">No. Seri</label>
          <input id="bc_edit_no_seri" type="text" bind:value={bcForm.no_seri} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Update</button>
        </div>
      </form>
    {/if}
  </Modal>

  <!-- Barang Certificates Detail Drawer -->
  <Drawer 
    bind:show={bcShowDetailDrawer} 
    title="Detail Barang Certificate"
    on:close={() => bcShowDetailDrawer = false}
  >
    <BarangCertificatesDetail barangCertificates={bcSelectedItem} />
  </Drawer>