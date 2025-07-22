<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';

  let projects: any[] = [];
  let customers: any[] = []; // Untuk dropdown customer di form
  let loading = true;
  let error = '';
  let search: string = '';
  let statusFilter: string = '';
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalProjects: number = 0;

  // Modal state for Create/Update
  let showCreateModal: boolean = false;
  let showEditModal: boolean = false;
  let editingProject: any = null; // Data proyek yang sedang diedit

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
          page: currentPage
        }
      });
      projects = response.data.data;
      currentPage = response.data.pagination.current_page;
      lastPage = response.data.pagination.last_page;
      totalProjects = response.data.pagination.total;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal memuat proyek.';
      console.error('Error fetching projects:', err);
    } finally {
      loading = false;
    }
  }

  async function fetchCustomers() {
    try {
      const response = await axiosClient.get('/mitras/customers');
      customers = response.data.data;
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      // Handle error, maybe show a message to the user
    }
  }

  onMount(() => {
    fetchProjects();
    fetchCustomers();
  });

  function handleFilterOrSearch() {
    currentPage = 1; // Reset halaman saat filter/search berubah
    fetchProjects();
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
    editingProject = { ...project }; // Copy data to avoid direct mutation
    // Format tanggal ke YYYY-MM-DD
    editingProject.start_date = project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '';
    editingProject.finish_date = project.finish_date ? new Date(project.finish_date).toISOString().split('T')[0] : '';
    
    // Set form data
    form = { ...editingProject, mitra_id: editingProject.mitra_id || '' };
    showEditModal = true;
  }

  async function handleSubmitCreate() {
    try {
      await axiosClient.post('/projects', form);
      alert('Proyek berhasil ditambahkan!');
      showCreateModal = false;
      fetchProjects(); // Refresh daftar
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan proyek.';
      alert('Error:\n' + messages);
      console.error('Create project failed:', err.response || err);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingProject?.id) return;
    try {
      await axiosClient.put(`/projects/${editingProject.id}`, form);
      alert('Proyek berhasil diperbarui!');
      showEditModal = false;
      fetchProjects(); // Refresh daftar
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui proyek.';
      alert('Error:\n' + messages);
      console.error('Update project failed:', err.response || err);
    }
  }

  async function handleDelete(projectId: number) {
    if (confirm('Apakah Anda yakin ingin menghapus proyek ini?')) {
      try {
        await axiosClient.delete(`/projects/${projectId}`);
        alert('Proyek berhasil dihapus!');
        fetchProjects(); // Refresh daftar
      } catch (err: any) {
        alert('Gagal menghapus proyek: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete project failed:', err.response || err);
      }
    }
  }
</script>

<h1 class="text-2xl font-semibold text-gray-900 mb-4">Daftar Project</h1>

<div class="flex justify-between items-center mb-6">
  <div class="flex space-x-2">
    <button
      on:click={() => { statusFilter = ''; handleFilterOrSearch(); }}
      class="px-3 py-2 rounded-md text-sm font-semibold {statusFilter === '' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}"
    >
      Semua Status
    </button>
    {#each projectStatuses as status}
      <button
        on:click={() => { statusFilter = status; handleFilterOrSearch(); }}
        class="px-3 py-2 rounded-md text-sm font-semibold {statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}"
      >
        {status}
      </button>
    {/each}
  </div>
  <div class="flex-grow ml-4">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Cari proyek..."
        bind:value={search}
        on:input={handleFilterOrSearch}
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  </div>
  <button
    on:click={openCreateModal}
    class="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    Tambah Project
  </button>
</div>

{#if loading}
  <p>Memuat proyek...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if projects.length === 0}
  <p class="text-gray-500">Belum ada project.</p>
{:else}
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
                  {project.status === 'Complete' ? 'bg-green-100 text-green-800' : ''}
                  {project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : ''}
                  {project.status === 'Prospect' ? 'bg-yellow-100 text-yellow-800' : ''}
                  {project.status === 'Cancel' ? 'bg-red-100 text-red-800' : ''}"
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
              class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

<Modal bind:show={showCreateModal} title="Form Project Baru">
  <form on:submit|preventDefault={handleSubmitCreate}>
    <div class="space-y-4">
      <div>
        <label for="create_name" class="block text-sm font-medium text-gray-900">Nama Project</label>
        <input type="text" id="create_name" bind:value={form.name} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label for="create_customer_id" class="block text-sm font-medium text-gray-900">Customer</label>
        <select id="create_customer_id" bind:value={form.mitra_id} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          <option value="">Pilih Customer</option>
          {#each customers as customer (customer.id)}
            <option value={customer.id}>{customer.nama}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="create_status" class="block text-sm font-medium text-gray-900">Status</label>
        <select id="create_status" bind:value={form.status} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          <option value="">Pilih Status</option>
          {#each projectStatuses as status}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="create_description" class="block text-sm font-medium text-gray-900">Deskripsi</label>
        <textarea id="create_description" bind:value={form.description} rows="4" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
      </div>
      <div>
        <label for="create_start_date" class="block text-sm font-medium text-gray-900">Tanggal Mulai</label>
        <input type="date" id="create_start_date" bind:value={form.start_date} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label for="create_finish_date" class="block text-sm font-medium text-gray-900">Tanggal Selesai (Opsional)</label>
        <input type="date" id="create_finish_date" bind:value={form.finish_date} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
      </div>
    </div>
    <div class="mt-6 flex justify-end">
      <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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
          <label for="edit_name" class="block text-sm font-medium text-gray-900">Nama Project</label>
          <input type="text" id="edit_name" bind:value={form.name} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label for="edit_customer_id" class="block text-sm font-medium text-gray-900">Customer</label>
          <select id="edit_customer_id" bind:value={form.mitra_id} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Pilih Customer</option>
            {#each customers as customer (customer.id)}
              <option value={customer.id}>{customer.nama}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="edit_status" class="block text-sm font-medium text-gray-900">Status</label>
          <select id="edit_status" bind:value={form.status} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Pilih Status</option>
            {#each projectStatuses as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="edit_description" class="block text-sm font-medium text-gray-900">Deskripsi</label>
          <textarea id="edit_description" bind:value={form.description} rows="4" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label for="edit_start_date" class="block text-sm font-medium text-gray-900">Tanggal Mulai</label>
          <input type="date" id="edit_start_date" bind:value={form.start_date} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label for="edit_finish_date" class="block text-sm font-medium text-gray-900">Tanggal Selesai (Opsional)</label>
          <input type="date" id="edit_finish_date" bind:value={form.finish_date} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
      </div>
      <div class="mt-6 flex justify-end">
        <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Update Project
        </button>
      </div>
    </form>
  {/if}
</Modal>