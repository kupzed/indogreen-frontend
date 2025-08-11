<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import ActivityDetail from '$lib/components/ActivityDetail.svelte';
  import ProjectDetail from '$lib/components/ProjectDetail.svelte';
  import Pagination from '$lib/components/Pagination.svelte';

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

  // Date filter state
  let activityDateFromFilter: string = '';
  let activityDateToFilter: string = '';
  let showActivityDateFilter: boolean = false;

  // Project Edit Modal
  let showEditProjectModal: boolean = false;
  let editProjectForm = {
    name: '',
    description: '',
    status: '',
    start_date: '',
    finish_date: '',
    mitra_id: '',
    kategori: '',
    lokasi: '',
    no_po: '',
    no_so: '',
  };
  const projectStatuses = ['Ongoing', 'Prospect', 'Complete', 'Cancel'];
  const projectKategoris = [
    'PLTS Hybrid', 
    'PLTS Ongrid', 
    'PLTS Offgrid', 
    'PJUTS All In One', 
    'PJUTS Two In One', 
    'PJUTS Konvensional'
  ];

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

  // Activity Edit Modal
  let showEditActivityModal: boolean = false;
  let editingActivity: any = null;
  let editActivityForm = {
    name: '',
    description: '',
    project_id: '',
    kategori: '',
    activity_date: '',
    attachment: null as File | null,
    jenis: '',
    mitra_id: null as string | null,
    from: '',
    to: '',
  };
  let editActivityFileName = '';
  
  // Drawer state for activity detail
  let showActivityDetailDrawer: boolean = false;
  let selectedActivity: any = null; // Data activity yang dipilih untuk detail

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
          date_from: activityDateFromFilter,
          date_to: activityDateToFilter,
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
        kategori: project.kategori || '',
        lokasi: project.lokasi || '',
        no_po: project.no_po || '',
        no_so: project.no_so || '',
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

  // Activity Handlers
  function goToActivityPage(page: number) {
    if (page > 0 && page <= activityLastPage) {
      activityCurrentPage = page;
      fetchProjectDetails();
    }
  }

  function handleActivityFilterOrSearch() {
    activityCurrentPage = 1; // Reset halaman saat filter/search berubah
    fetchProjectDetails();
  }

  // Date filter functions
  function clearActivityFilters() {
    activityJenisFilter = '';
    activityKategoriFilter = '';
    activitySearch = '';
    activityDateFromFilter = '';
    activityDateToFilter = '';
    activityCurrentPage = 1;
    fetchProjectDetails();
  }

  function toggleActivityDateFilter() {
    showActivityDateFilter = !showActivityDateFilter;
  }

  function handleActivityDateFilter() {
    activityCurrentPage = 1;
    fetchProjectDetails();
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-filter-dropdown')) {
      showActivityDateFilter = false;
    }
  }

  onMount(() => {
    fetchProjectDetails();
    fetchFormDependencies();
    
    // Add click outside listener for date filter dropdown
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
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

  function handleEditAttachmentChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      editActivityForm.attachment = target.files[0];
      editActivityFileName = target.files[0].name;
    } else {
      editActivityForm.attachment = null;
      editActivityFileName = '';
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

  function openEditActivityModal(activity: any) {
    editingActivity = { ...activity };
    // Format date to YYYY-MM-DD
    editingActivity.activity_date = activity.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '';

    // Set form data
    editActivityForm = { 
      ...editingActivity,
      project_id: editingActivity.project_id || '',
      kategori: editingActivity.kategori || '',
      jenis: editingActivity.jenis || '',
      mitra_id: editingActivity.mitra_id || '',
      attachment: null,
      from: editingActivity.from || '',
      to: editingActivity.to || '',
    };
    
    editActivityFileName = activity.attachment ? activity.attachment.split('/').pop() : '';
    showEditActivityModal = true;
  }

  function openActivityDetailDrawer(activity: any) {
    selectedActivity = { ...activity };
    showActivityDetailDrawer = true;
  }

  async function handleSubmitUpdateActivity() {
    if (!editingActivity?.id) return;
    try {
      const formData = new FormData();
      for (const key in editActivityForm) {
        const typedKey = key as keyof typeof editActivityForm;
        if (typedKey === 'attachment' && editActivityForm.attachment) {
          formData.append(typedKey, editActivityForm.attachment);
        } else if (editActivityForm[typedKey] !== null && editActivityForm[typedKey] !== undefined) {
          formData.append(typedKey, editActivityForm[typedKey] as string | Blob);
        }
      }

      // Handle dynamic mitra_id based on jenis for activity
      if (editActivityForm.jenis === 'Internal') {
        formData.set('mitra_id', '1');
      } else if (editActivityForm.jenis === 'Customer') {
        formData.set('mitra_id', project.mitra_id);
      } else if (editActivityForm.jenis === 'Vendor' && editActivityForm.mitra_id) {
        formData.set('mitra_id', editActivityForm.mitra_id);
      } else {
        formData.delete('mitra_id');
      }

      formData.append('_method', 'PUT');

      await axiosClient.post(`/activities/${editingActivity.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Aktivitas berhasil diperbarui!');
      goto(`/projects/${project.id}`);
      showEditActivityModal = false;
      fetchProjectDetails(); // Refresh activities list
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui aktivitas.';
      alert('Error:\n' + messages);
      console.error('Update activity failed:', err.response || err);
    }
  }

  async function handleDeleteActivity(activityId: number) {
    if (confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) {
      try {
        await axiosClient.delete(`/activities/${activityId}`);
        alert('Aktivitas berhasil dihapus!');
        goto(`/projects/${project.id}`);
        fetchProjectDetails(); // Refresh activities list
      } catch (err: any) {
        alert('Gagal menghapus aktivitas: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete activity failed:', err.response || err);
      }
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

  // State untuk tab
  let activeTab: 'detail' | 'activity' | 'mitra' = 'activity';
  
  // State untuk toggle tampilan activity
  let activityView: 'table' | 'list' = 'table';
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
          on:click={() => (activeTab = 'activity')}
          class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
          class:bg-white={activeTab === 'activity'}
          class:shadow={activeTab === 'activity'}
          class:text-gray-600={activeTab !== 'activity'}
          role="tab"
          aria-selected={activeTab === 'activity'}
        >
          Activity
        </button>
        <button
          on:click={() => (activeTab = 'mitra')}
          class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
          class:bg-white={activeTab === 'mitra'}
          class:shadow={activeTab === 'mitra'}
          class:text-gray-600={activeTab !== 'mitra'}
          role="tab"
          aria-selected={activeTab === 'mitra'}
        >
          Mitra
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    {#if activeTab === 'detail'}
      <div class="bg-white shadow overflow-hidden mb-8">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Project</h3>
        </div>
        <div class="border-t border-gray-100">
          <ProjectDetail project={project} />
        </div>
      </div>
    {/if}

    {#if activeTab === 'activity'}
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
          <div class="flex w-full sm:w-auto space-x-2">
            <select bind:value={activityJenisFilter} on:change={handleActivityFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
              <option value="">Filter Jenis: Semua</option>
              {#each activityJenisList as jenis}
                <option value={jenis}>{jenis}</option>
              {/each}
            </select>
            <select bind:value={activityKategoriFilter} on:change={handleActivityFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
              <option value="">Filter Kategori: Semua</option>
              {#each activityKategoriList as kategori}
                <option value={kategori}>{kategori}</option>
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
                placeholder="Cari aktivitas..."
                bind:value={activitySearch}
                on:input={handleActivityFilterOrSearch}
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <button
            on:click={openCreateActivityModal}
            class="px-4 py-2 w-full sm:w-auto border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Tambah Aktivitas
          </button>
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="p-1 bg-gray-200 rounded-lg inline-flex" role="tablist">
            <button
              on:click={() => (activityView = 'table')}
              class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
              class:bg-white={activityView === 'table'}
              class:shadow={activityView === 'table'}
              class:text-gray-600={activityView !== 'table'}
              role="tab"
              aria-selected={activityView === 'table'}
            >
              Table
            </button>
            <button
              on:click={() => (activityView = 'list')}
              class="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
              class:bg-white={activityView === 'list'}
              class:shadow={activityView === 'list'}
              class:text-gray-600={activityView !== 'list'}
              role="tab"
              aria-selected={activityView === 'list'}
            >
              Simple
            </button>
          </div>
          
          <!-- Date Filter Button -->
          <div class="relative date-filter-dropdown">
            <button
              on:click={toggleActivityDateFilter}
              class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              class:bg-indigo-50={activityDateFromFilter || activityDateToFilter}
              class:border-indigo-300={activityDateFromFilter || activityDateToFilter}
              class:text-indigo-700={activityDateFromFilter || activityDateToFilter}
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Filter Tanggal
              {#if activityDateFromFilter || activityDateToFilter}
                <div class="w-2 h-2 bg-indigo-600 rounded-full ml-2"></div>
              {/if}
              <svg class="w-4 h-4 transition-transform" class:rotate-180={showActivityDateFilter} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {#if showActivityDateFilter}
              <div class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-medium text-gray-900">Filter Tanggal Aktivitas</h3>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button
                      on:click={toggleActivityDateFilter}
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div class="space-y-3">
                    <div>
                      <!-- svelte-ignore a11y_label_has_associated_control -->
                      <label class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                      <input
                        type="date"
                        bind:value={activityDateFromFilter}
                        on:change={handleActivityDateFilter}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <!-- svelte-ignore a11y_label_has_associated_control -->
                      <label class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                      <input
                        type="date"
                        bind:value={activityDateToFilter}
                        on:change={handleActivityDateFilter}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    {#if activityDateFromFilter || activityDateToFilter}
                      <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Filter Aktif:</strong><br>
                        {#if activityDateFromFilter && activityDateToFilter}
                          {new Date(activityDateFromFilter).toLocaleDateString('id-ID')} - {new Date(activityDateToFilter).toLocaleDateString('id-ID')}
                        {:else if activityDateFromFilter}
                          Dari {new Date(activityDateFromFilter).toLocaleDateString('id-ID')}
                        {:else if activityDateToFilter}
                          Sampai {new Date(activityDateToFilter).toLocaleDateString('id-ID')}
                        {/if}
                      </div>
                    {/if}
                  </div>
                  
                  <div class="flex justify-between mt-4 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      on:click={clearActivityFilters}
                      class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      on:click={toggleActivityDateFilter}
                      class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        {#if activityView === 'list'}
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
                    <div class="flex justify-end px-4 py-2 sm:px-6 space-x-2">
                      <button
                        on:click|stopPropagation={() => openEditActivityModal(activity)}
                        class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        on:click|stopPropagation={() => handleDeleteActivity(activity.id)}
                        class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                {/each}
              {/if}
            </ul>
            {#if activities.length > 0}
              <Pagination
                currentPage={activityCurrentPage}
                lastPage={activityLastPage}
                onPageChange={goToActivityPage}
                totalItems={totalActivities}
                itemsPerPage={10}
              />
            {/if}
          </div>
        {/if}

        {#if activityView === 'table'}
          <div class="mt-4 bg-white shadow-md rounded-lg">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nama Aktivitas
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Kategori
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Jenis
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Mitra
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tanggal Aktivitas
                    </th>
                    <th scope="col" class="relative px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  {#each activities as activity (activity.id)}
                    <tr>
                      <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        <a href={`/activities/${activity.id}`} class="text-indigo-600 hover:text-indigo-900" title="Detail">
                          {activity.name}
                        </a>
                        <br>
                        <span class="text-xs text-gray-500">{activity.description.substring(0, 40)}{activity.description.length > 40 ? '...' : ''}</span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 text-gray-900">
                          {activity.kategori}
                        </span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {activity.jenis}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {#if activity.jenis === 'Vendor' && activity.mitra}
                          {activity.mitra.nama}
                        {:else if activity.jenis === 'Customer' && activity.mitra}
                          {activity.mitra.nama}
                        {:else}
                          -
                        {/if}
                      </td>
                      <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td class="relative whitespace-nowrap px-3 py-4 text-left text-sm font-medium">
                        <div class="flex items-left space-x-2">
                          <button on:click={() => openActivityDetailDrawer(activity)} class="text-indigo-600 hover:text-indigo-900" title="Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span class="sr-only">Detail, {activity.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => openEditActivityModal(activity)} title="Edit" class="text-blue-600 hover:text-blue-900">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span class="sr-only">Edit, {activity.name}</span>
                          </button>
                          <button on:click|stopPropagation={() => handleDeleteActivity(activity.id)} title="Delete" class="text-red-600 hover:text-red-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            <span class="sr-only">Hapus, {activity.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            {#if activities.length > 0}
              <Pagination
                currentPage={activityCurrentPage}
                lastPage={activityLastPage}
                onPageChange={goToActivityPage}
                totalItems={totalActivities}
                itemsPerPage={10}
              />
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'mitra'}
      <div class="mb-8">
        <h1>Mitra</h1>
      </div>
    {/if}
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
            <label for="edit_project_kategori" class="block text-sm/6 font-medium text-gray-900">Kategori</label>
            <div class="mt-2">
              <select id="edit_project_kategori" bind:value={editProjectForm.kategori} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                <option value="">Pilih Kategori</option>
                {#each projectKategoris as kategori}
                  <option value={kategori}>{kategori}</option>
                {/each}
              </select>
            </div>
          </div>
          <div>
            <label for="edit_project_lokasi" class="block text-sm/6 font-medium text-gray-900">Lokasi</label>
            <div class="mt-2">
              <textarea id="edit_project_lokasi" bind:value={editProjectForm.lokasi} rows="2" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="edit_project_no_po" class="block text-sm/6 font-medium text-gray-900">No. PO</label>
              <div class="mt-2">
                <input type="text" id="edit_project_no_po" bind:value={editProjectForm.no_po} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
              </div>
            </div>
            <div>
              <label for="edit_project_no_so" class="block text-sm/6 font-medium text-gray-900">No. SO</label>
              <div class="mt-2">
                <input type="text" id="edit_project_no_so" bind:value={editProjectForm.no_so} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
              </div>
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

  <Modal bind:show={showCreateActivityModal} title="Form Tambah Aktivitas" maxWidth="max-w-xl">
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

    <Modal bind:show={showEditActivityModal} title="Edit Aktivitas" maxWidth="max-w-xl">
      {#if editingActivity}
        <h1 class="text-center text-base font-bold tracking-tight text-gray-900">
          Project : {project.name}
        </h1>
        <h1 class="text-center text-base font-bold tracking-tight text-gray-900 mb-6">
          Customer : {project.mitra?.nama || '-'}
        </h1>
        <form on:submit|preventDefault={handleSubmitUpdateActivity}>
          <div class="space-y-4">
            <div>
              <label for="edit_activity_name" class="block text-sm/6 font-medium text-gray-900">Nama Aktivitas</label>
              <div class="mt-2">
                <input type="text" id="edit_activity_name" bind:value={editActivityForm.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
              </div>
            </div>
            <div>
              <label for="edit_modal_jenis" class="block text-sm/6 font-medium text-gray-900">Jenis</label>
              <div class="mt-2">
                <select id="edit_modal_jenis" bind:value={editActivityForm.jenis} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                  <option value="">Pilih Jenis</option>
                  {#each activityJenisList as jenis}
                    <option value={jenis}>{jenis}</option>
                  {/each}
                </select>
              </div>
            </div>
            {#if editActivityForm.jenis === 'Vendor'}
              <div>
                <label for="edit_modal_mitra_id" class="block text-sm/6 font-medium text-gray-900">Vendor</label>
                <div class="mt-2">
                  <select id="edit_modal_mitra_id" bind:value={editActivityForm.mitra_id} required={editActivityForm.jenis === 'Vendor'} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                    <option value="">Pilih Vendor</option>
                    {#each vendors as vendor (vendor.id)}
                      <option value={vendor.id}>{vendor.nama}</option>
                    {/each}
                  </select>
                </div>
              </div>
            {/if}
            <div>
              <label for="edit_modal_kategori" class="block text-sm/6 font-medium text-gray-900">Kategori</label>
              <div class="mt-2">
                <select id="edit_modal_kategori" bind:value={editActivityForm.kategori} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                  <option value="">Pilih Kategori</option>
                  {#each activityKategoriList as kategori}
                    <option value={kategori}>{kategori}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div>
              <label for="edit_activity_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
              <div class="mt-2">
                <textarea id="edit_activity_from" bind:value={editActivityForm.from} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
              </div>
            </div>
            <div>
              <label for="edit_activity_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
              <div class="mt-2">
                <textarea id="edit_activity_to" bind:value={editActivityForm.to} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
              </div>
            </div>
            <div>
              <label for="edit_activity_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
              <div class="mt-2">
                <textarea id="edit_activity_description" bind:value={editActivityForm.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
              </div>
            </div>
            <div>
              <label for="edit_activity_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Aktivitas</label>
              <div class="mt-2">
                <input type="date" id="edit_activity_date" bind:value={editActivityForm.activity_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
              </div>
            </div>
            <div>
              <label for="edit_file_upload" class="block text-sm/6 font-medium text-gray-900">Attachment File</label>
              <div class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div class="text-center">
                  <svg class="mx-auto size-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd" />
                  </svg>
                  <div class="mt-4 flex text-sm text-gray-600">
                    <label for="edit_file_upload" class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:outline-hidden hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input id="edit_file_upload" name="attachment" type="file" class="sr-only" on:change={handleEditAttachmentChange} />
                    </label>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-600">
                    {editActivityFileName || 'PNG, JPG, GIF up to 10MB'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6">
            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Update Aktivitas
            </button>
          </div>
        </form>
      {/if}
    </Modal>
  {/if}

  <!-- Activity Detail Drawer -->
  <Drawer 
    bind:show={showActivityDetailDrawer} 
    title="Detail Activity"
    on:close={() => showActivityDetailDrawer = false}
  >
    <ActivityDetail activity={selectedActivity} />
  </Drawer>