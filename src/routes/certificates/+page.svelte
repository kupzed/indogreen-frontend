<script lang="ts">
  import { onMount } from 'svelte';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import CertificateDetail from '$lib/components/detail/CertificatesDetail.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  type Option = { id: number; name?: string; nama?: string; title?: string; no_seri?: string };
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
  let filteredBarangCertificates: Option[] = [];
  let loading = true;
  let error = '';
  let search = '';
  let statusFilter: '' | Certificate['status'] = '';
  let dateFromFilter = '';
  let dateToFilter = '';
  let showDateFilter = false;
  let currentPage = 1;
  let lastPage = 1;
  let totalItems = 0;

  // Modal state
  let showCreateModal = false;
  let showEditModal = false;
  let showDetailDrawer = false;
  let editingItem: Certificate | null = null;
  let selectedItem: Certificate | null = null;
  let activeView: 'table' | 'list' = 'table';
  // Form state
  let formFileName = '';
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
      const res = await axiosClient.get('/certificate/getFormDependencies');
      projects = res.data?.data?.projects ?? res.data?.projects ?? [];
      barangCertificates = res.data?.data?.barang_certificates ?? res.data?.barang_certificates ?? [];
      filteredBarangCertificates = [];
    } catch (err) {
      console.error('Failed to fetch dependencies', err);
    }
  }

  async function fetchBarangCertificatesByProject(projectId: number) {
    if (!projectId) {
      filteredBarangCertificates = [];
      return;
    }
    
    try {
      const res = await axiosClient.get(`/certificate/getBarangCertificatesByProject/${projectId}`);
      filteredBarangCertificates = res.data?.data ?? [];
    } catch (err) {
      console.error('Failed to fetch barang certificates by project', err);
      filteredBarangCertificates = [];
    }
  }

  function handleProjectChange(projectId: number | '' | null) {
    if (projectId) {
      fetchBarangCertificatesByProject(Number(projectId));
      // Reset barang certificate selection when project changes
      form.barang_certificate_id = '';
    } else {
      filteredBarangCertificates = [];
      form.barang_certificate_id = '';
    }
  }

  async function fetchList() {
    loading = true;
    error = '';
    try {
      const res = await axiosClient.get('/certificates', {
        params: {
          search,
          status: statusFilter,
          date_from: dateFromFilter,
          date_to: dateToFilter,
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
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function handleFilterOrSearch() {
    currentPage = 1;
    fetchList();
  }

  function handleSearchChange() {
    currentPage = 1;
    fetchList();
  }

  function goToPage(page: number) {
    if (page > 0 && page <= lastPage) {
      currentPage = page;
      fetchList();
    }
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
    formFileName = '';
    filteredBarangCertificates = [];
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
    formFileName = item.attachment ? String(item.attachment).split('/').pop() ?? '' : '';
    
    // Fetch barang certificates for the selected project
    if (item.project_id) {
      fetchBarangCertificatesByProject(Number(item.project_id));
    } else {
      filteredBarangCertificates = [];
    }
    
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
    // Always append date fields, even if empty (for proper deletion)
    fd.append('date_of_issue', form.date_of_issue || '');
    fd.append('date_of_expired', form.date_of_expired || '');
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

  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-800';
      case 'Tidak Aktif':
        return 'bg-red-100 text-red-800';
      case 'Belum':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>Daftar Sertifikat - Indogreen</title>
</svelte:head>

<div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
  <div class="flex w-full sm:w-auto space-x-2">
    <select bind:value={statusFilter} on:change={handleFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
      <option value="">Filter Status: Semua</option>
      {#each statuses as s}
        <option value={s}>{s}</option>
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
        placeholder="Cari certificate..."
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
      Tambah Sertif
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
      <div class="date-filter-dropdown absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4">
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
            <label for="filter_from" class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal Terbit</label>
            <input
              id="filter_from"
              type="date"
              bind:value={dateFromFilter}
              on:change={handleFilterOrSearch}
              class="w-full px-3 py-2 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label for="filter_to" class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal Terbit</label>
            <input
              id="filter_to"
              type="date"
              bind:value={dateToFilter}
              on:change={handleFilterOrSearch}
              class="w-full px-3 py-2 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div class="flex space-x-2 pt-2">
            <button
              on:click={() => { dateFromFilter = ''; dateToFilter = ''; handleFilterOrSearch(); }}
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
            <a href={`/certificates/${item.id}`} class="block hover:bg-gray-50 px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-indigo-600 truncate">
                  {item.name}
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(item.status)}">
                    {item.status}
                  </span>
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">
                    Project: {item.project?.name || '-'} | Barang: {item.barang_certificate?.name || '-'} | No: {item.no_certificate}
                  </p>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  {#if item.date_of_issue}
                    <p>Terbit: {new Date(item.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  {:else}
                    <p>Terbit: -</p>
                  {/if}
                </div>
              </div>
            </a>
            <div class="flex justify-end px-4 py-2 sm:px-6 space-x-2">
              <button on:click|stopPropagation={() => openDetailDrawer(item)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700">
                Detail
              </button>
              <button on:click|stopPropagation={() => openEditModal(item)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Edit
              </button>
              <button on:click|stopPropagation={() => handleDelete(item.id)} class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700">
                Hapus
              </button>
            </div>
          </li>
        {/each}
      </ul>
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

  {#if activeView === 'table'}
    <div class="mt-4 bg-white shadow-md rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Nama
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                No. Sertifikat
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Barang Sertifikat
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Terbit
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Expired
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Lampiran
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each items as item (item.id)}
              <tr>
                <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                  <a href={`/certificates/${item.id}`} class="text-indigo-600 hover:text-indigo-900">
                    {item.name}
                  </a><br>
                  <span class="text-xs text-gray-500">
                    {item.project?.name || '-'}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.no_certificate}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.barang_certificate?.name || '-'}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(item.status)}">
                    {item.status}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {#if item.date_of_issue}
                    {new Date(item.date_of_issue).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {:else}
                    <span class="text-gray-500">-</span>
                  {/if}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {#if item.date_of_expired}
                    {new Date(item.date_of_expired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {:else}
                    <span class="text-gray-500">-</span>
                  {/if}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-indigo-600">
                  {#if item.attachment}
                  <a href={item.attachment} target="_blank" rel="noreferrer" class="hover:text-indigo-900">
                    Lihat
                  </a>{:else}-{/if}
                </td>
                <td class="relative whitespace-nowrap px-3 py-4 text-sm">
                  <div class="flex items-center space-x-2">
                    <button on:click={() => openDetailDrawer(item)} title="Detail" class="text-yellow-600 hover:text-yellow-900">
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
{/if}

<Modal bind:show={showCreateModal} title="Tambah Sertifikat">
  <form on:submit|preventDefault={handleSubmitCreate} class="space-y-4">
    <div>
      <label for="create_name" class="block text-sm font-medium text-gray-900">Nama</label>
      <input id="create_name" type="text" bind:value={form.name} required placeholder="Masukkan nama sertifikat" class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
    <div>
      <label for="create_no_certificate" class="block text-sm font-medium text-gray-900">No. Sertifikat</label>
      <input id="create_no_certificate" type="text" bind:value={form.no_certificate} required placeholder="Masukkan no sertifikat" class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </div>
    <div>
      <label for="create_project" class="block text-sm font-medium text-gray-900">Project</label>
      <select id="create_project" bind:value={form.project_id} required on:change={(e) => handleProjectChange((e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : '')} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Pilih Project</option>
        {#each projects as p}
          <option value={p.id}>{p.name ?? p.title}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="create_barang_certificate" class="block text-sm font-medium text-gray-900">Barang Certificate</label>
      <select id="create_barang_certificate" bind:value={form.barang_certificate_id} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" disabled={filteredBarangCertificates.length === 0}>
        <option value="">{filteredBarangCertificates.length === 0 ? 'Pilih Project terlebih dahulu' : 'Pilih Barang Certificate'}</option>
        {#each filteredBarangCertificates as b}
          <option value={b.id}>{b.name ?? b.title} - {b.no_seri}</option>
        {/each}
      </select>
      {#if form.project_id && filteredBarangCertificates.length === 0}
        <p class="mt-1 text-sm text-gray-500">Tidak ada Barang Certificate untuk Project ini</p>
      {/if}
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
        <input id="create_issue" type="date" bind:value={form.date_of_issue} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="create_expired" class="block text-sm font-medium text-gray-900">Tanggal Expired</label>
        <input id="create_expired" type="date" bind:value={form.date_of_expired} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
    </div>
    <FileAttachment
      id="create_attachment"
      label="Lampiran"
      bind:file={form.attachment}
      bind:fileName={formFileName}
      on:change={(e) => {
        form.attachment = e.detail.file;
        formFileName = e.detail.fileName;
      }}
    />
    <div>
      <button type="submit" class="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Simpan</button>
    </div>
  </form>
</Modal>

<Modal bind:show={showEditModal} title="Edit Sertifikat">
  {#if editingItem}
    <form on:submit|preventDefault={handleSubmitUpdate} class="space-y-4">
      <div>
        <label for="edit_name" class="block text-sm font-medium text-gray-900">Nama</label>
        <input id="edit_name" type="text" bind:value={form.name} required placeholder="Masukkan nama sertifikat" class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="edit_no_certificate" class="block text-sm font-medium text-gray-900">No. Sertifikat</label>
        <input id="edit_no_certificate" type="text" bind:value={form.no_certificate} required placeholder="Masukkan no sertifikat" class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label for="edit_project" class="block text-sm font-medium text-gray-900">Project</label>
        <select id="edit_project" bind:value={form.project_id} required on:change={(e) => handleProjectChange((e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : '')} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="">Pilih Project</option>
          {#each projects as p}
            <option value={p.id}>{p.name ?? p.title}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="edit_barang_certificate" class="block text-sm font-medium text-gray-900">Barang Certificate</label>
        <select id="edit_barang_certificate" bind:value={form.barang_certificate_id} required class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" disabled={filteredBarangCertificates.length === 0}>
          <option value="">{filteredBarangCertificates.length === 0 ? 'Pilih Project terlebih dahulu' : 'Pilih Barang Certificate'}</option>
          {#each filteredBarangCertificates as b}
            <option value={b.id}>{b.name ?? b.title} - {b.no_seri}</option>
          {/each}
        </select>
        {#if form.project_id && filteredBarangCertificates.length === 0}
          <p class="mt-1 text-sm text-gray-500">Tidak ada Barang Certificate untuk Project ini</p>
        {/if}
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
          <input id="edit_issue" type="date" bind:value={form.date_of_issue} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label for="edit_expired" class="block text-sm font-medium text-gray-900">Tanggal Expired</label>
          <input id="edit_expired" type="date" bind:value={form.date_of_expired} class="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <FileAttachment
        id="edit_attachment"
        label="Lampiran"
        bind:file={form.attachment}
        bind:fileName={formFileName}
        on:change={(e) => {
          form.attachment = e.detail.file;
          formFileName = e.detail.fileName;
        }}
      />
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
  <CertificateDetail certificates={selectedItem} />
</Drawer>



