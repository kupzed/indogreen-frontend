<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';

  let projectId: string | null = null;
  let project: any = null;
  let activities: any[] = [];
  let customers: any[] = []; // Untuk dropdown customer di form edit project
  let vendors: any[] = []; // Untuk dropdown vendor di form create/edit activity
  let loadingProject = true;
  let loadingActivities = true;
  let errorProject = '';
  let errorActivities = '';

  // Activity filter/search state
  let activityJenisFilter: string = '';
  let activityKategoriFilter: string = '';
  let activitySearch: string = '';
  let activityCurrentPage: number = 1;
  let activityLastPage: number = 1;
  let totalActivities: number = 0;

  // Project Edit Modal
  let showEditProjectModal: boolean = false;
  let editProjectForm = {
    name: '',
    description: '',
    status: '',
    start_date: '',
    finish_date: '',
    mitra_id: '',
  };
  const projectStatuses = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];

  // Activity Create Modal
  let showCreateActivityModal: boolean = false;
  let createActivityForm = {
    name: '',
    description: '',
    project_id: '', // Will be pre-filled with current project.id
    kategori: '',
    activity_date: '',
    attachment: null as File | null,
    jenis: '',
    mitra_id: null as string | null, // Can be null for 'Internal' or customer_id/mitra_id
    from: '',
    to: '',
  };
  let createActivityFileName = '';

  // Dynamic lists for activity form
  const activityKategoriList = [
    'Expense Report', 'Invoice', 'Purchase Order', 'Payment', 'Quotation',
    'Faktur Pajak', 'Kasbon', 'Laporan Teknis', 'Surat Masuk', 'Surat Keluar'
  ];
  const activityJenisList = ['Internal', 'Customer', 'Vendor'];

  // Function to determine text color for status badges
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Prospect': return 'bg-yellow-100 text-yellow-800';
      case 'Cancel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  async function fetchProjectDetails() {
    loadingProject = true;
    errorProject = '';
    projectId = $page.params.id;
    if (!projectId) {
      errorProject = 'Project ID tidak ditemukan.';
      loadingProject = false;
      return;
    }
    try {
      const response = await axiosClient.get(`/projects/${projectId}`, {
        params: {
          jenis: activityJenisFilter,
          kategori: activityKategoriFilter,
          search: activitySearch,
          page: activityCurrentPage,
        }
      });
      project = response.data.data.project;
      activities = response.data.data.activities;
      activityCurrentPage = response.data.data.activity_pagination.current_page;
      activityLastPage = response.data.data.activity_pagination.last_page;
      totalActivities = response.data.data.activity_pagination.total;

      // Pre-fill edit project form
      editProjectForm = {
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        finish_date: project.finish_date ? new Date(project.finish_date).toISOString().split('T')[0] : '',
        mitra_id: project.mitra_id || '',
      };
      
      // Pre-fill create activity form project_id
      createActivityForm.project_id = project.id;
      // Pre-fill customer_id in create activity form if project has one
      if (project.mitra && project.mitra.is_customer) {
        createActivityForm.mitra_id = project.mitra.id; // Assign customer's mitra_id
        createActivityForm.jenis = 'Customer';
      } else {
        createActivityForm.jenis = ''; // Default or Internal
      }

    } catch (err: any) {
      errorProject = err.response?.data?.message || 'Gagal memuat detail proyek.';
      console.error('Error fetching project details:', err.response || err);
    } finally {
      loadingProject = false;
      loadingActivities = false;
    }
  }

  async function fetchFormDependencies() {
    try {
      // Fetch only vendors for activity creation form if needed
      const response = await axiosClient.get('/mitra/vendors');
      vendors = response.data.data;

      // Fetch customers for project edit modal
      const customerResponse = await axiosClient.get('/mitra/customers');
      customers = customerResponse.data.data;
    } catch (err) {
      console.error('Failed to fetch form dependencies:', err);
    }
  }

  onMount(() => {
    fetchProjectDetails();
    fetchFormDependencies();
  });

  // Project Edit Handlers
  function openEditProjectModal() {
    showEditProjectModal = true;
  }

  async function handleSubmitUpdateProject() {
    if (!project?.id) return;
    try {
      await axiosClient.put(`/projects/${project.id}`, editProjectForm);
      alert('Proyek berhasil diperbarui!');
      goto(`/projects/${project.id}`);
      showEditProjectModal = false;
      fetchProjectDetails(); // Refresh project details
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui proyek.';
      alert('Error:\n' + messages);
      console.error('Update project failed:', err.response || err);
    }
  }

  async function handleDeleteProject() {
    if (!project?.id) return;
    if (confirm('Apakah Anda yakin ingin menghapus proyek ini?')) {
      try {
        await axiosClient.delete(`/projects/${project.id}`);
        alert('Proyek berhasil dihapus!');
        goto('/projects'); // Redirect ke daftar proyek setelah dihapus
      } catch (err: any) {
        alert('Gagal menghapus proyek: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete project failed:', err.response || err);
      }
    }
  }

  // Activity Handlers
  function handleActivityFilterOrSearch() {
    activityCurrentPage = 1; // Reset halaman saat filter/search berubah
    fetchProjectDetails();
  }

  function goToActivityPage(page: number) {
    if (page > 0 && page <= activityLastPage) {
      activityCurrentPage = page;
      fetchProjectDetails();
    }
  }

  function openCreateActivityModal() {
    // Reset form and pre-fill project_id
    createActivityForm = {
      name: '',
      description: '',
      project_id: project.id,
      kategori: '',
      activity_date: '',
      attachment: null,
      jenis: project.mitra && project.mitra.is_customer ? 'Customer' : '', // default to customer if project has one
      mitra_id: project.mitra && project.mitra.is_customer ? project.mitra.id : null,
      from: '',
      to: '',
    };
    createActivityFileName = '';
    showCreateActivityModal = true;
  }

  function handleAttachmentChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      createActivityForm.attachment = target.files[0];
      createActivityFileName = target.files[0].name;
    } else {
      createActivityForm.attachment = null;
      createActivityFileName = '';
    }
  }

  async function handleSubmitCreateActivity() {
    try {
      const formData = new FormData();
      for (const key in createActivityForm) {
        const typedKey = key as keyof typeof createActivityForm;
        if (typedKey === 'attachment' && createActivityForm.attachment) {
          formData.append(typedKey, createActivityForm.attachment);
        } else if (createActivityForm[typedKey] !== null && createActivityForm[typedKey] !== undefined) {
          formData.append(typedKey, createActivityForm[typedKey] as string | Blob);
        }
      }

      // Handle dynamic mitra_id based on jenis for activity
      if (createActivityForm.jenis === 'Internal') {
        formData.set('mitra_id', '1'); // Asumsi mitra_id 1 adalah 'Internal'
      } else if (createActivityForm.jenis === 'Customer') {
        formData.set('mitra_id', project.mitra_id); // Ambil dari project
      } else if (createActivityForm.jenis === 'Vendor' && createActivityForm.mitra_id) {
        formData.set('mitra_id', createActivityForm.mitra_id);
      } else {
         formData.delete('mitra_id'); // Ensure mitra_id is not sent if not Customer/Vendor
      }


      await axiosClient.post('/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Aktivitas berhasil ditambahkan!');
      goto(`/projects/${project.id}`);
      showCreateActivityModal = false;
      fetchProjectDetails(); // Refresh activities list
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan aktivitas.';
      alert('Error:\n' + messages);
      console.error('Create activity failed:', err.response || err);
    }
  }

  // Update customer_id/mitra_id selection based on activity type
  $: if (showCreateActivityModal && createActivityForm.jenis) {
    if (createActivityForm.jenis === 'Customer') {
      createActivityForm.mitra_id = project?.mitra_id || null;
    } else if (createActivityForm.jenis === 'Internal') {
      createActivityForm.mitra_id = '1'; // Placeholder for internal partner ID
    } else if (createActivityForm.jenis === 'Vendor' && !vendors.some(v => v.id === createActivityForm.mitra_id)) {
      // If selected 'Vendor' but current mitra_id is not a vendor or is empty, reset it
      createActivityForm.mitra_id = '';
    }
  }

  // Reset form saat modal ditutup
  $: if (!showCreateActivityModal) {
    createActivityForm.mitra_id = '';
    createActivityForm.jenis = '';
  }
</script>


{#if loadingProject}
  <p>Memuat detail proyek...</p>
{:else if errorProject}
  <p class="text-red-500">{errorProject}</p>
{:else if project}
  <div class="max-w-1xl mx-auto mb-8">
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-2xl">
          {project.name}
        </h2>
        <div class="my-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="my-2 flex items-center text-sm text-gray-500">
            <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div class="my-2 flex items-center text-sm text-gray-500">
            <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(project.status)}">
              {project.status}
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 mb-4 md:mt-0 md:ml-4 md:mb-4 space-y-2 md:space-y-0 md:space-x-4">
        <button
          on:click={openEditProjectModal}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit Project
        </button>
        <button
          on:click={handleDeleteProject}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Hapus Project
        </button>
      </div>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Project</h3>
      </div>
      <div class="border-t border-gray-200">
        <dl class="divide-y divide-gray-100">
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Nama Project</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {project.name}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Customer</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if project.mitra}
                <a href={`/mitras/${project.mitra.id}`} class="text-indigo-600 hover:text-indigo-900">{project.mitra.nama}</a>
              {:else}
                -
              {/if}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Status</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(project.status)}">
                {project.status}
              </span>
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {project.description}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Tanggal Mulai</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Tanggal Selesai</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if project.finish_date}
                {new Date(project.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              {:else}
                Tanggal belum ditambahkan
              {/if}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="mt-8">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          Aktivitas Project
        </h3>
        <button
          on:click={openCreateActivityModal}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Tambah Aktivitas
        </button>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between my-4 space-y-4 sm:space-y-0 sm:space-x-4">
        <div class="flex space-x-2 w-full sm:w-auto">
          <select bind:value={activityJenisFilter} on:change={handleActivityFilterOrSearch} class="block w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Filter Jenis: Semua</option>
            {#each activityJenisList as jenis}
              <option value={jenis}>{jenis}</option>
            {/each}
          </select>
          <select bind:value={activityKategoriFilter} on:change={handleActivityFilterOrSearch} class="block w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Filter Kategori: Semua</option>
            {#each activityKategoriList as kategori}
              <option value={kategori}>{kategori}</option>
            {/each}
          </select>
        </div>
        <div class="w-full sm:w-auto flex-grow">
          <div class="relative w-full">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari aktivitas..."
              bind:value={activitySearch}
              on:input={handleActivityFilterOrSearch}
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div class="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200">
          {#if activities.length === 0}
            <li class="px-4 py-4 sm:px-6">
              <p class="text-sm text-gray-500">Belum ada aktivitas untuk project ini.</p>
            </li>
          {:else}
            {#each activities as activity (activity.id)}
              <li>
                <a href={`/activities/${activity.id}`} class="block hover:bg-gray-50 px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600 truncate">
                      {activity.name}
                    </p>
                    <div class="ml-2 flex-shrink-0 flex">
                      <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 text-gray-900">
                        {activity.kategori}
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500">
                        Jenis: {activity.jenis}
                        {#if activity.jenis === 'Vendor' && activity.mitra}
                          | Vendor: {activity.mitra.nama}
                        {:else if activity.jenis === 'Customer' && activity.mitra}
                          | Customer: {activity.mitra.nama}
                        {/if}
                        | Deskripsi: {activity.description.substring(0, 40)}{activity.description.length > 40 ? '...' : ''}
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                      </svg>
                      <p>
                        Aktivitas: {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </a>
              </li>
            {/each}
          {/if}
        </ul>

        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex flex-1 justify-between sm:hidden">
            <button on:click={() => goToActivityPage(activityCurrentPage - 1)} disabled={activityCurrentPage === 1} class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 {activityCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">Previous</button>
            <button on:click={() => goToActivityPage(activityCurrentPage + 1)} disabled={activityCurrentPage === activityLastPage} class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 {activityCurrentPage === activityLastPage ? 'opacity-50 cursor-not-allowed' : ''}">Next</button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{(activityCurrentPage - 1) * 10 + 1}</span>
                to
                <span class="font-medium">{(activityCurrentPage - 1) * 10 + activities.length}</span>
                of
                <span class="font-medium">{totalActivities}</span>
                results
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                <button on:click={() => goToActivityPage(activityCurrentPage - 1)} disabled={activityCurrentPage === 1} class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 {activityCurrentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
                  </svg>
                </button>
                {#each Array(activityLastPage).fill(0) as _, i}
                  {@const pageNum = i + 1}
                  <button
                    on:click={() => goToActivityPage(pageNum)}
                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum === activityCurrentPage ? 'z-10 bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50'} focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    aria-current={pageNum === activityCurrentPage ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                {/each}
                <button on:click={() => goToActivityPage(activityCurrentPage + 1)} disabled={activityCurrentPage === activityLastPage} class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 {activityCurrentPage === activityLastPage ? 'opacity-50 cursor-not-allowed' : ''}">
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
  </div>

  <Modal bind:show={showEditProjectModal} title="Edit Project">
    {#if project}
      <form on:submit|preventDefault={handleSubmitUpdateProject}>
        <div class="space-y-4">
          <div>
            <label for="edit_project_name" class="block text-sm/6 font-medium text-gray-900">Nama Project</label>
            <div class="mt-2">
              <input type="text" id="edit_project_name" bind:value={editProjectForm.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_project_customer_id" class="block text-sm/6 font-medium text-gray-900">Customer</label>
            <div class="mt-2">
              <select id="edit_project_customer_id" bind:value={editProjectForm.mitra_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                <option value="">Pilih Customer</option>
                {#each customers as customer (customer.id)}
                  <option value={customer.id}>{customer.nama}</option>
                {/each}
              </select>
            </div>
          </div>
          <div>
            <label for="edit_project_status" class="block text-sm/6 font-medium text-gray-900">Status</label>
            <div class="mt-2">
              <select id="edit_project_status" bind:value={editProjectForm.status} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                <option value="">Pilih Status</option>
                {#each projectStatuses as status}
                  <option value={status}>{status}</option>
                {/each}
              </select>
            </div>
          </div>
          <div>
            <label for="edit_project_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
            <div class="mt-2">
              <textarea id="edit_project_description" bind:value={editProjectForm.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
            </div>
          </div>
          <div>
            <label for="edit_project_start_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Mulai</label>
            <div class="mt-2">
              <input type="date" id="edit_project_start_date" bind:value={editProjectForm.start_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_project_finish_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Selesai (Opsional)</label>
            <div class="mt-2">
              <input type="date" id="edit_project_finish_date" bind:value={editProjectForm.finish_date} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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

  <Modal bind:show={showCreateActivityModal} title="Form Aktivitas Baru" maxWidth="max-w-xl">
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900">
      Project : {project.name}
    </h1>
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 mb-6">
      Customer : {project.mitra?.nama || '-'}
    </h1>
    <form on:submit|preventDefault={handleSubmitCreateActivity}>
      <div class="space-y-4">
        <div>
          <label for="activity_name" class="block text-sm/6 font-medium text-gray-900">Nama Aktivitas</label>
          <div class="mt-2">
            <input type="text" id="activity_name" bind:value={createActivityForm.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="modal_jenis" class="block text-sm/6 font-medium text-gray-900">Jenis</label>
          <div class="mt-2">
            <select id="modal_jenis" bind:value={createActivityForm.jenis} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Jenis</option>
              {#each activityJenisList as jenis}
                <option value={jenis}>{jenis}</option>
              {/each}
            </select>
          </div>
        </div>
        {#if createActivityForm.jenis === 'Vendor'}
          <div>
            <label for="modal_mitra_id" class="block text-sm/6 font-medium text-gray-900">Vendor</label>
            <div class="mt-2">
              <select id="modal_mitra_id" bind:value={createActivityForm.mitra_id} required={createActivityForm.jenis === 'Vendor'} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                <option value="">Pilih Vendor</option>
                {#each vendors as vendor (vendor.id)}
                  <option value={vendor.id}>{vendor.nama}</option>
                {/each}
              </select>
            </div>
          </div>
        {/if}
        <div>
          <label for="modal_kategori" class="block text-sm/6 font-medium text-gray-900">Kategori</label>
          <div class="mt-2">
            <select id="modal_kategori" bind:value={createActivityForm.kategori} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Kategori</option>
              {#each activityKategoriList as kategori}
                <option value={kategori}>{kategori}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label for="activity_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
          <div class="mt-2">
            <textarea id="activity_from" bind:value={createActivityForm.from} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="activity_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
          <div class="mt-2">
            <textarea id="activity_to" bind:value={createActivityForm.to} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="activity_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
          <div class="mt-2">
            <textarea id="activity_description" bind:value={createActivityForm.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="activity_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Aktivitas</label>
          <div class="mt-2">
            <input type="date" id="activity_date" bind:value={createActivityForm.activity_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="file_upload" class="block text-sm/6 font-medium text-gray-900">Attachment File</label>
          <div class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
            <div class="text-center">
              <svg class="mx-auto size-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd" />
              </svg>
              <div class="mt-4 flex text-sm text-gray-600">
                <label for="file_upload" class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:outline-hidden hover:text-indigo-500">
                  <span>Upload a file</span>
                  <input id="file_upload" name="attachment" type="file" class="sr-only" on:change={handleAttachmentChange} />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-600">
                {createActivityFileName || 'PNG, JPG, GIF up to 10MB'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6">
        <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Tambah Aktivitas
        </button>
      </div>
    </form>
  </Modal>
{/if}