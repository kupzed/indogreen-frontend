<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import ProjectDetail from '$lib/components/ProjectDetail.svelte';

  let projects: any[] = [];
  let customers: any[] = [];
  let loading = true;
  let error = '';
  let search: string = '';
  let statusFilter: string = '';
  let dateFromFilter: string = '';
  let dateToFilter: string = '';
  let showDateFilter: boolean = false;
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalProjects: number = 0;

  // State baru untuk toggle tampilan
  let activeView: 'table' | 'list' = 'table';

  // Modal state for Create/Update
  let showCreateModal: boolean = false;
  let showEditModal: boolean = false;
  let editingProject: any = null; // Data project yang sedang diedit
  
  // Drawer state for project detail
  let showDetailDrawer: boolean = false;
  let selectedProject: any = null; // Data project yang dipilih untuk detail

  // Form data for Create/Update
  let form = {
    name: '',
    description: '',
    status: '',
    start_date: '',
    finish_date: '',
    mitra_id: '', // Di backend Anda ini adalah customer_id
  };
  const projectStatuses = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];

  async function fetchProjects() {
    loading = true;
    error = '';
    try {
      const response = await axiosClient.get('/projects', {
        params: {
          search: search,
          status: statusFilter,
          date_from: dateFromFilter,
          date_to: dateToFilter,
          page: currentPage
        }
      });
      projects = response.data.data;
      currentPage = response.data.pagination.current_page;
      lastPage = response.data.pagination.last_page;
      totalProjects = response.data.pagination.total;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal memuat project.';
      console.error('Error fetching projects:', err);
    } finally {
      loading = false;
    }
  }

  async function fetchCustomers() {
    try {
      const response = await axiosClient.get('/mitra/customers');
      console.log('DATA CUSTOMERS:', response.data.data);
      customers = response.data.data;
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      // Handle error, maybe show a message to the user
    }
  }

  onMount(() => {
    fetchProjects();
    fetchCustomers();
    
    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
    
      return () => {
    document.removeEventListener('click', handleClickOutside);
  };
  });
  function handleFilterOrSearch() {
    currentPage = 1; // Reset halaman saat filter/search berubah
    fetchProjects();
  }

  function clearFilters() {
    search = '';
    statusFilter = '';
    dateFromFilter = '';
    dateToFilter = '';
    showDateFilter = false;
    currentPage = 1;
    fetchProjects();
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
      fetchProjects();
    }
  }

  function openCreateModal() {
    // Reset form for new project
    form = {
      name: '',
      description: '',
      status: '',
      start_date: '',
      finish_date: '',
      mitra_id: '',
    };
    showCreateModal = true;
  }

  function openEditModal(project: any) {
    editingProject = { ...project };
    // Copy data to avoid direct mutation
    // Format tanggal ke YYYY-MM-DD
    editingProject.start_date = project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '';
    editingProject.finish_date = project.finish_date ? new Date(project.finish_date).toISOString().split('T')[0] : '';
    // Set form data
    form = { ...editingProject, mitra_id: editingProject.mitra_id || '' };
    showEditModal = true;
  }

  function openDetailDrawer(project: any) {
    selectedProject = { ...project };
    showDetailDrawer = true;
  }

  async function handleSubmitCreate() {
    try {
      await axiosClient.post('/projects', form);
      alert('Project berhasil ditambahkan!');
      goto(`/projects`);
      showCreateModal = false;
      fetchProjects(); // Refresh daftar
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan project.';
      alert('Error:\n' + messages);
      console.error('Create project failed:', err.response || err);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingProject?.id) return;
    try {
      await axiosClient.put(`/projects/${editingProject.id}`, form);
      alert('Project berhasil diperbarui!');
      goto(`/projects`);
      showEditModal = false;
      fetchProjects(); // Refresh daftar
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui project.';
      alert('Error:\n' + messages);
      console.error('Update project failed:', err.response || err);
    }
  }

  async function handleDelete(projectId: number) {
    if (confirm('Apakah Anda yakin ingin menghapus project ini?')) {
      try {
        await axiosClient.delete(`/projects/${projectId}`);
        alert('Project berhasil dihapus!');
        goto(`/projects`);
        fetchProjects(); // Refresh daftar
      } catch (err: any) {
        alert('Gagal menghapus project: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete project failed:', err.response || err);
      }
    }
  }

  // Helper function for badge colors (from existing code)
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Prospect': return 'bg-yellow-100 text-yellow-800';
      case 'Cancel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
  <div class="flex w-full sm:w-auto space-x-2">
    <button
      on:click={() => { statusFilter = ''; handleFilterOrSearch(); }}
      class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold {statusFilter === '' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}"
    >
      Semua Status
    </button>
    {#each projectStatuses as status}
      <button
        on:click={() => { statusFilter = status; handleFilterOrSearch(); }}
        class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold {statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}"
      >
        {status}
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
        placeholder="Cari project..."
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
    Tambah Project
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
  <p>Memuat project...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if projects.length === 0}
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <ul class="divide-y divide-gray-200">
      <li class="px-4 py-4 sm:px-6">
        <p class="text-sm text-gray-500">Belum ada project.</p>
      </li>
    </ul>
  </div>
{:else}
  {#if activeView === 'list'}
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        {#each projects as project (project.id)}
          <li>
            <a href={`/projects/${project.id}`} class="block hover:bg-gray-50 px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-indigo-600 truncate">
                  {project.name}
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5
                    {getStatusBadgeClasses(project.status)}"
                  >
                    {project.status}
                  </span>
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">
                    Customer: {project.mitra?.nama || '-'} | Deskripsi: {project.description.substring(0, 50)}{project.description.length > 50 ? '...' : ''}
                  </p>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  <p>
                    Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </a>
            <div class="flex justify-end px-4 py-2 sm:px-6 space-x-2">
              <button
                on:click|stopPropagation={() => openEditModal(project)}
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
              <button
                on:click|stopPropagation={() => handleDelete(project.id)}
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
              <span class="font-medium">{(currentPage - 1) * 10 + projects.length}</span>
              of
              <span class="font-medium">{totalProjects}</span>
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

  {#if activeView === 'table'}
    <div class="mt-4 bg-white shadow-md rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Nama Project
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Lokasi
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Tahun
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Kategori
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Dilaksanakan
              </th>
              <th scope="col" class="relative px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each projects as project (project.id)}
              <tr>
                <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                  <a href={`/projects/${project.id}`} class="text-indigo-600 hover:text-indigo-900" title="Detail">
                    {project.name}
                  </a>
                  <br>
                  <span class="text-xs text-gray-500">{project.mitra.nama}</span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  Leuwiliang, Bogor
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {new Date(project.start_date).toLocaleDateString('id-ID', { year: 'numeric' })}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  PLTS Hybrid
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5
                    {getStatusBadgeClasses(project.status)}"
                  >
                    {project.status}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  <br>
                  {#if project.finish_date}
                    {new Date(project.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {:else}
                    -
                  {/if}
                </td>
                <td class="relative whitespace-nowrap px-3 py-4 text-left text-sm font-medium">
                  <div class="flex items-left space-x-2">
                    <button on:click={() => openDetailDrawer(project)} class="text-indigo-600 hover:text-indigo-900" title="Detail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span class="sr-only">Detail, {project.name}</span>
                    </button>
                    <button on:click|stopPropagation={() => openEditModal(project)} title="Edit" class="text-blue-600 hover:text-blue-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      <span class="sr-only">Edit, {project.name}</span>
                    </button>
                    <button on:click|stopPropagation={() => handleDelete(project.id)} title="Delete" class="text-red-600 hover:text-red-900">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      <span class="sr-only">Hapus, {project.name}</span>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div>
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
                <span class="font-medium">{(currentPage - 1) * 10 + projects.length}</span>
                of
                <span class="font-medium">{totalProjects}</span>
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
    </div>
  {/if}
{/if}


<Modal bind:show={showCreateModal} title="Form Project Baru">
  <form on:submit|preventDefault={handleSubmitCreate}>
    <div class="space-y-4">
      <div>
        <label for="create_name" class="block text-sm/6 font-medium text-gray-900">Nama Project</label>
        <div class="mt-2">
          <input type="text" id="create_name" bind:value={form.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_customer_id" class="block text-sm/6 font-medium text-gray-900">Customer</label>
        <div class="mt-2">
          <select id="create_customer_id" bind:value={form.mitra_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Customer</option>
            {#each customers as customer (customer.id)}
              <option value={customer.id}>{customer.nama}</option>
            {/each}
          </select>
        </div>
      </div>
      <div>
        <label for="create_status" class="block text-sm/6 font-medium text-gray-900">Status</label>
        <div class="mt-2">
          <select id="create_status" bind:value={form.status} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Status</option>
            {#each projectStatuses as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>
      </div>
      <div>
        <label for="create_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
        <div class="mt-2">
          <textarea id="create_description" bind:value={form.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
        </div>
      </div>
      <div>
        <label for="create_start_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Mulai</label>
        <div class="mt-2">
          <input type="date" id="create_start_date" bind:value={form.start_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_finish_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Selesai (Opsional)</label>
        <div class="mt-2">
          <input type="date" id="create_finish_date" bind:value={form.finish_date} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
    </div>
    <div class="mt-6">
      <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Tambah Project
      </button>
    </div>
  </form>
</Modal>

<Modal bind:show={showEditModal} title="Edit Project">
  {#if editingProject}
    <form on:submit|preventDefault={handleSubmitUpdate}>
      <div class="space-y-4">
        <div>
          <label for="edit_name" class="block text-sm/6 font-medium text-gray-900">Nama Project</label>
          <div class="mt-2">
            <input type="text" id="edit_name" bind:value={form.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_customer_id" class="block text-sm/6 font-medium text-gray-900">Customer</label>
          <div class="mt-2">
            <select id="edit_customer_id" bind:value={form.mitra_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Customer</option>
              {#each customers as customer (customer.id)}
                <option value={customer.id}>{customer.nama}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label for="edit_status" class="block text-sm/6 font-medium text-gray-900">Status</label>
          <div class="mt-2">
            <select id="edit_status" bind:value={form.status} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Status</option>
              {#each projectStatuses as status}
                <option value={status}>{status}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label for="edit_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
          <div class="mt-2">
            <textarea id="edit_description" bind:value={form.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="edit_start_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Mulai</label>
          <div class="mt-2">
            <input type="date" id="edit_start_date" bind:value={form.start_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_finish_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Selesai (Opsional)</label>
          <div class="mt-2">
            <input type="date" id="edit_finish_date" bind:value={form.finish_date} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
      </div>
      <div class="mt-6">
        <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Update Project
        </button>
      </div>
    </form>
  {/if}
</Modal>

<!-- Project Detail Drawer -->
<Drawer 
  bind:show={showDetailDrawer} 
  title="Detail Project"
  on:close={() => showDetailDrawer = false}
>
  <ProjectDetail project={selectedProject} />
</Drawer>