<script lang="ts">
  import { onMount } from 'svelte';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import CertificatesDetail from '$lib/components/detail/CertificatesDetail.svelte';

  type Option = { id: number; name?: string; nama?: string; title?: string };
  type Certificate = {
    id: number;
    name: string;
    no_certificate: string;
    project_id: number | '' | null;
    barang_certificate_id: number | '' | null;
    status: 'Belum' | 'Tidak Aktif' | 'Aktif';
    date_of_issue: string;
    date_of_expired: string;
    attachment?: string | null;
    project?: { id: number; name: string } | null;
    barang_certificate?: { id: number; name: string } | null;
  };

  const statuses = ['Belum', 'Tidak Aktif', 'Aktif'] as const;

  let items: Certificate[] = [];
  let projects: Option[] = [];
  let barangCertificates: Option[] = [];
  let loading = true;
  let error = '';
  let search = '';
  let currentPage = 1;
  let lastPage = 1;
  let totalItems = 0;

  // Modal state
  let showCreateModal = false;
  let showEditModal = false;
  let showDetailDrawer = false;
  let editingItem: Certificate | null = null;
  let selectedItem: Certificate | null = null;
  // Form state
  let form: {
    name: string;
    no_certificate: string;
    project_id: number | '' | null;
    barang_certificate_id: number | '' | null;
    status: Certificate['status'] | '';
    date_of_issue: string;
    date_of_expired: string;
    attachment: File | null;
  } = {
    name: '',
    no_certificate: '',
    project_id: '',
    barang_certificate_id: '',
    status: '',
    date_of_issue: '',
    date_of_expired: '',
    attachment: null
  };

  async function fetchDependencies() {
    try {
      const res = await axiosClient.get('/certificates/getFormDependencies');
      projects = res.data?.data?.projects ?? res.data?.projects ?? [];
      barangCertificates = res.data?.data?.barang_certificates ?? res.data?.barang_certificates ?? [];
    } catch (err) {
      console.error('Failed to fetch dependencies', err);
    }
  }

  async function fetchList() {
    loading = true;
    error = '';
    try {
      const res = await axiosClient.get('/certificates', {
        params: {
          search,
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

  function clearSearch() {
    search = '';
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
    form = {
      name: '',
      no_certificate: '',
      project_id: '',
      barang_certificate_id: '',
      status: '',
      date_of_issue: '',
      date_of_expired: '',
      attachment: null
    };
    showCreateModal = true;
  }

  function openEditModal(item: Certificate) {
    editingItem = { ...item };
    form = {
      name: item.name ?? '',
      no_certificate: item.no_certificate ?? '',
      project_id: item.project_id ?? '',
      barang_certificate_id: item.barang_certificate_id ?? '',
      status: item.status ?? '',
      date_of_issue: item.date_of_issue ? new Date(item.date_of_issue).toISOString().split('T')[0] : '',
      date_of_expired: item.date_of_expired ? new Date(item.date_of_expired).toISOString().split('T')[0] : '',
      attachment: null
    };
    showEditModal = true;
  }

  function openDetailDrawer(item: Certificate) {
    selectedItem = { ...item };
    showDetailDrawer = true;
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('no_certificate', form.no_certificate);
    if (form.project_id !== '' && form.project_id !== null) fd.append('project_id', String(form.project_id));
    if (form.barang_certificate_id !== '' && form.barang_certificate_id !== null) fd.append('barang_certificate_id', String(form.barang_certificate_id));
    if (form.status) fd.append('status', form.status);
    if (form.date_of_issue) fd.append('date_of_issue', form.date_of_issue);
    if (form.date_of_expired) fd.append('date_of_expired', form.date_of_expired);
    if (form.attachment) fd.append('attachment', form.attachment);
    return fd;
  }

  async function handleSubmitCreate() {
    try {
      const fd = buildFormData();
      await axiosClient.post('/certificates', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
      const fd = buildFormData();
      // Many backends expect method spoof for multipart updates
      fd.append('_method', 'PUT');
      await axiosClient.post(`/certificates/${editingItem.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
      await axiosClient.delete(`/certificates/${id}`);
      alert('Data berhasil dihapus');
      fetchList();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
      console.error('Delete failed:', err.response || err);
    }
  }
</script>

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
        placeholder="Cari certificate..."
        bind:value={search}
        on:input={handleSearchChange}
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  </div>
  <div class="flex space-x-2 w-full sm:w-auto">
    <button on:click={clearSearch} class="px-3 py-2 border rounded-md text-sm bg-white">Clear</button>
    <button
      on:click={openCreateModal}
      class="px-4 py-2 w-full sm:w-auto border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Tambah
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
  <div class="mt-4 bg-white shadow-md rounded-lg">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nama</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">No. Sertifikat</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Barang Cert.</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Terbit</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expired</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lampiran</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each items as item (item.id)}
            <tr>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                <a href={`/certificates/${item.id}`} class="text-indigo-600 hover:text-indigo-900">{item.name}</a>
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.no_certificate}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.project?.name || '-'}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.barang_certificate?.name || '-'}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.status}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(item.date_of_issue).toLocaleDateString('id-ID')}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(item.date_of_expired).toLocaleDateString('id-ID')}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-indigo-600">
                {#if item.attachment}
                  <a href={item.attachment} target="_blank" rel="noreferrer" class="hover:underline">Lihat</a>
                {:else}-{/if}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm">
                <div class="flex items-center space-x-2">
                  <button on:click={() => openDetailDrawer(item)} title="Detail" class="text-indigo-600 hover:text-indigo-900">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <span class="sr-only">Detail, {item.name}</span>
                  </button>
                  <button on:click={() => openEditModal(item)} title="Edit" class="text-blue-600 hover:text-blue-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
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
      <Pagination
        currentPage={currentPage}
        lastPage={lastPage}
        onPageChange={goToPage}
        totalItems={totalItems}
        itemsPerPage={10}
      />
    {/if}
  </div>
{/if}

<Modal bind:show={showCreateModal} title="Tambah Certificate">
  <form on:submit|preventDefault={handleSubmitCreate} class="space-y-4">
    <div>
      <label for="create_name" class="block text-sm font-medium text-gray-900">Nama</label>
      <input id="create_name" type="text" bind:value={form.name} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
    <div>
      <label for="create_no_certificate" class="block text-sm font-medium text-gray-900">No. Sertifikat</label>
      <input id="create_no_certificate" type="text" bind:value={form.no_certificate} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
    <div>
      <label for="create_project" class="block text-sm font-medium text-gray-900">Project</label>
      <select id="create_project" bind:value={form.project_id} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Pilih Project (opsional)</option>
        {#each projects as p}
          <option value={p.id}>{p.name ?? p.title}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="create_barang_certificate" class="block text-sm font-medium text-gray-900">Barang Certificate</label>
      <select id="create_barang_certificate" bind:value={form.barang_certificate_id} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Pilih Barang Certificate (opsional)</option>
        {#each barangCertificates as b}
          <option value={b.id}>{b.name ?? b.title}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="create_status" class="block text-sm font-medium text-gray-900">Status</label>
      <select id="create_status" bind:value={form.status} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Pilih Status</option>
        {#each statuses as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="create_issue" class="block text-sm font-medium text-gray-900">Tanggal Terbit</label>
        <input id="create_issue" type="date" bind:value={form.date_of_issue} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="create_expired" class="block text-sm font-medium text-gray-900">Tanggal Expired</label>
        <input id="create_expired" type="date" bind:value={form.date_of_expired} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
    </div>
    <div>
      <label for="create_attachment" class="block text-sm font-medium text-gray-900">Lampiran (Opsional)</label>
      <input id="create_attachment" type="file" accept="application/pdf,image/*" on:change={(e: Event) => {
        const input = e.target as HTMLInputElement;
        form.attachment = input.files && input.files[0] ? input.files[0] : null;
      }} class="mt-1 block w-full text-sm" />
    </div>
    <div>
      <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Simpan</button>
    </div>
  </form>
</Modal>

<Modal bind:show={showEditModal} title="Edit Certificate">
  {#if editingItem}
    <form on:submit|preventDefault={handleSubmitUpdate} class="space-y-4">
      <div>
        <label for="edit_name" class="block text-sm font-medium text-gray-900">Nama</label>
        <input id="edit_name" type="text" bind:value={form.name} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="edit_no_certificate" class="block text-sm font-medium text-gray-900">No. Sertifikat</label>
        <input id="edit_no_certificate" type="text" bind:value={form.no_certificate} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="edit_project" class="block text-sm font-medium text-gray-900">Project</label>
        <select id="edit_project" bind:value={form.project_id} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">Pilih Project (opsional)</option>
          {#each projects as p}
            <option value={p.id}>{p.name ?? p.title}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="edit_barang_certificate" class="block text-sm font-medium text-gray-900">Barang Certificate</label>
        <select id="edit_barang_certificate" bind:value={form.barang_certificate_id} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">Pilih Barang Certificate (opsional)</option>
          {#each barangCertificates as b}
            <option value={b.id}>{b.name ?? b.title}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="edit_status" class="block text-sm font-medium text-gray-900">Status</label>
        <select id="edit_status" bind:value={form.status} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">Pilih Status</option>
          {#each statuses as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="edit_issue" class="block text-sm font-medium text-gray-900">Tanggal Terbit</label>
          <input id="edit_issue" type="date" bind:value={form.date_of_issue} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label for="edit_expired" class="block text-sm font-medium text-gray-900">Tanggal Expired</label>
          <input id="edit_expired" type="date" bind:value={form.date_of_expired} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label for="edit_attachment" class="block text-sm font-medium text-gray-900">Lampiran (Opsional)</label>
        <input id="edit_attachment" type="file" accept="application/pdf,image/*" on:change={(e: Event) => {
          const input = e.target as HTMLInputElement;
          form.attachment = input.files && input.files[0] ? input.files[0] : null;
        }} class="mt-1 block w-full text-sm" />
      </div>
      <div>
        <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Update</button>
      </div>
    </form>
  {/if}
</Modal>

<Drawer 
  bind:show={showDetailDrawer} 
  title="Detail Sertifikat"
  on:close={() => showDetailDrawer = false}
>
  <CertificatesDetail certificates={selectedItem} />
</Drawer>



