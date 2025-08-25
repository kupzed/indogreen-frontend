<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ActivityDetail from '$lib/components/detail/ActivityDetail.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  let activities: any[] = [];
  let projects: any[] = []; // For project dropdown in activity forms
  let vendors: any[] = []; // For vendor dropdown (if 'jenis' is vendor)
  let loading = true;
  let error = '';
  let search: string = '';
  let jenisFilter: string = '';
  let kategoriFilter: string = '';
  let dateFromFilter: string = '';
  let dateToFilter: string = '';
  let showDateFilter: boolean = false;
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalActivities: number = 0;

  // State untuk toggle tampilan
  let activeView: 'table' | 'list' = 'table';

  // Modal state for Create/Update
  let showCreateModal: boolean = false;
  let showEditModal: boolean = false;
  let editingActivity: any = null; // Data aktivitas yang sedang diedit
  
  // Drawer state for activity detail
  let showDetailDrawer: boolean = false;
  let selectedActivity: any = null; // Data activity yang dipilih untuk detail

  // Form data for Create/Update
  let form = {
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
    attachment_removed: false, // Flag to indicate if attachment was removed
  };
  let formFileName = ''; // To display selected file name

  const activityKategoriList = [
    'Expense Report', 'Invoice', 'Purchase Order', 'Payment', 'Quotation',
    'Faktur Pajak', 'Kasbon', 'Laporan Teknis', 'Surat Masuk', 'Surat Keluar', 'Kontrak'
  ];
  const activityJenisList = ['Internal', 'Customer', 'Vendor'];

  async function fetchActivities() {
    loading = true;
    error = '';
    try {
      const response = await axiosClient.get('/activities', {
        params: {
          search: search,
          jenis: jenisFilter,
          kategori: kategoriFilter,
          date_from: dateFromFilter,
          date_to: dateToFilter,
          page: currentPage
        }
      });
      activities = response.data.data;
      currentPage = response.data.pagination.current_page;
      lastPage = response.data.pagination.last_page;
      totalActivities = response.data.pagination.total;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal memuat aktivitas.';
      console.error('Error fetching activities:', err);
    } finally {
      loading = false;
    }
  }

  async function fetchFormDependencies() {
    try {
      const response = await axiosClient.get('/activity/getFormDependencies');
      projects = response.data.projects;
      vendors = response.data.vendors; // Perbaiki: ambil dari vendors, bukan mitras
    } catch (err) {
      console.error('Failed to fetch form dependencies:', err);
    }
  }

  onMount(() => {
    fetchActivities();
    fetchFormDependencies();
    
    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function handleFilterOrSearch() {
    currentPage = 1; // Reset halaman saat filter/search berubah
    fetchActivities();
  }

  function clearFilters() {
    search = '';
    jenisFilter = '';
    kategoriFilter = '';
    dateFromFilter = '';
    dateToFilter = '';
    showDateFilter = false;
    currentPage = 1;
    fetchActivities();
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
      fetchActivities();
    }
  }

  function openCreateModal() {
    // Reset form for new activity
    form = {
      name: '',
      description: '',
      project_id: '',
      kategori: '',
      activity_date: '',
      attachment: null,
      jenis: '',
      mitra_id: null,
      from: '',
      to: '',
      attachment_removed: false,
    };
    formFileName = ''; // Clear file name display
    showCreateModal = true;
  }

  function openEditModal(activity: any) {
    editingActivity = { ...activity }; // Copy data to avoid direct mutation
    
    // Format date to YYYY-MM-DD
    editingActivity.activity_date = activity.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '';

    // Set form data
    form = { 
      ...editingActivity,
      project_id: editingActivity.project_id || '',
      kategori: editingActivity.kategori || '',
      jenis: editingActivity.jenis || '',
      mitra_id: editingActivity.mitra_id || '',
      attachment: null, // Clear file input for edit, new file will replace
      from: editingActivity.from || '',
      to: editingActivity.to || '',
      attachment_removed: false,
    };
    
    // If jenis is Customer, set mitra_id to the project's mitra_id
    if (form.jenis === 'Customer' && form.project_id) {
      const selectedProject = projects.find(p => p.id == form.project_id);
      if (selectedProject?.mitra_id) {
        form.mitra_id = selectedProject.mitra_id;
      }
    }
    
    formFileName = activity.attachment ? activity.attachment.split('/').pop() : ''; // Display current attachment name
    showEditModal = true;
  }

  function openDetailDrawer(activity: any) {
    selectedActivity = { ...activity };
    showDetailDrawer = true;
  }

  function handleAttachmentChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      form.attachment = target.files[0];
      formFileName = target.files[0].name;
      form.attachment_removed = false; // If new file selected, old one is implicitly replaced
    } else {
      form.attachment = null;
      formFileName = '';
      // If user clears the input without selecting a new file, it means they want to remove it
      // This logic might need adjustment based on explicit "remove attachment" button in UI
      // For now, if no file is selected, it implicitly means removal if one existed before.
      if (editingActivity?.attachment) {
        form.attachment_removed = true;
      }
    }
  }

  async function handleSubmitCreate() {
    try {
      const formData = new FormData();
      for (const key in form) {
        const typedKey = key as keyof typeof form;
        if (typedKey === 'attachment' && form.attachment) {
          formData.append(typedKey, form.attachment);
        } else if (typedKey !== 'attachment_removed' && form[typedKey] !== null && form[typedKey] !== undefined) {
          formData.append(typedKey, form[typedKey] as string | Blob);
        }
      }

      // Handle dynamic mitra_id based on jenis for activity
      if (form.jenis === 'Internal') {
        formData.set('mitra_id', '1'); // Asumsi mitra_id 1 adalah 'Internal'
      } else if (form.jenis === 'Customer') {
        // Find the project's mitra_id if the project is selected
        const selectedProject = projects.find(p => p.id == form.project_id);
        if (selectedProject?.mitra_id) { // Using project's mitra_id
          formData.set('mitra_id', selectedProject.mitra_id);
        } else {
          formData.delete('mitra_id'); // Ensure it's not sent if no mitra found for project
        }
      } else if (form.jenis === 'Vendor' && form.mitra_id) {
        formData.set('mitra_id', form.mitra_id);
      } else {
        formData.delete('mitra_id'); // Ensure mitra_id is not sent if not Customer/Vendor
      }

      await axiosClient.post('/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Aktivitas berhasil ditambahkan!');
      goto(`/activities`);
      showCreateModal = false;
      fetchActivities(); // Refresh list
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal menambahkan aktivitas.';
      alert('Error:\n' + messages);
      console.error('Create activity failed:', err.response || err);
    }
  }

  async function handleSubmitUpdate() {
    if (!editingActivity?.id) return;
    try {
      const formData = new FormData();
      for (const key in form) {
        const typedKey = key as keyof typeof form;
        if (typedKey === 'attachment' && form.attachment) {
          formData.append(typedKey, form.attachment);
        } else if (typedKey === 'attachment_removed') {
          formData.append(typedKey, form.attachment_removed ? '1' : '0');
        } else if (form[typedKey] !== null && form[typedKey] !== undefined) {
          formData.append(typedKey, form[typedKey] as string | Blob);
        }
      }

      // Handle dynamic mitra_id based on jenis for activity
      if (form.jenis === 'Internal') {
        formData.set('mitra_id', '1'); // Asumsi mitra_id 1 adalah 'Internal'
      } else if (form.jenis === 'Customer') {
        // Find the project's mitra_id if the project is selected
        const selectedProject = projects.find(p => p.id == form.project_id);
        if (selectedProject?.mitra_id) { // Using project's mitra_id
          formData.set('mitra_id', selectedProject.mitra_id);
        } else {
          formData.delete('mitra_id');
        }
      } else if (form.jenis === 'Vendor' && form.mitra_id) {
        formData.set('mitra_id', form.mitra_id);
      } else {
        formData.delete('mitra_id');
      }

      formData.append('_method', 'PUT'); // For Laravel to recognize PUT with FormData

      await axiosClient.post(`/activities/${editingActivity.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Aktivitas berhasil diperbarui!');
      goto(`/activities`);
      showEditModal = false;
      fetchActivities(); // Refresh list
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui aktivitas.';
      alert('Error:\n' + messages);
      console.error('Update activity failed:', err.response || err);
    }
  }

  async function handleDelete(activityId: number) {
    if (confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) {
      try {
        await axiosClient.delete(`/activities/${activityId}`);
        alert('Aktivitas berhasil dihapus!');
        goto(`/activities`);
        fetchActivities(); // Refresh list
      } catch (err: any) {
        alert('Gagal menghapus aktivitas: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete activity failed:', err.response || err);
      }
    }
  }

  // Reactive logic for mitra_id dropdown in forms
  $: if ((showCreateModal || showEditModal) && form.jenis) {
    if (form.jenis === 'Customer') {
      const selectedProject = projects.find(p => p.id == form.project_id);
      if (form.mitra_id !== (selectedProject?.mitra_id || null)) {
        form.mitra_id = selectedProject?.mitra_id || null;
      }
    } else if (form.jenis === 'Internal') {
      if (form.mitra_id !== '1') {
        form.mitra_id = '1';
      }
    } else if (form.jenis === 'Vendor') {
      if (Array.isArray(vendors) && !vendors.some(v => v.id === form.mitra_id)) {
        form.mitra_id = '';
      }
    } else {
      if (form.mitra_id !== null && form.mitra_id !== '') {
        form.mitra_id = '';
      }
    }
  }

  // Reset form saat modal ditutup
  $: if (!showCreateModal && !showEditModal) {
    form.mitra_id = '';
    form.jenis = '';
  }
</script>

<svelte:head>
  <title>Daftar Activity - Indogreen</title>
</svelte:head>

<div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
  <div class="flex w-full sm:w-auto space-x-2">
    <select bind:value={jenisFilter} on:change={handleFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
      <option value="">Filter Jenis: Semua</option>
      {#each activityJenisList as jenis}
        <option value={jenis}>{jenis}</option>
      {/each}
    </select>
    <select bind:value={kategoriFilter} on:change={handleFilterOrSearch} class="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
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
    Tambah Aktivitas
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
  <p>Memuat aktivitas...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if activities.length === 0}
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
                    Project: {activity.project?.name || '-'}
                    | Jenis: {activity.jenis}
                    {#if (activity.jenis === 'Vendor' || activity.jenis === 'Customer') && activity.mitra}
                      | {activity.jenis}: {activity.mitra.nama}
                    {/if}
                    | Deskripsi: {activity.description?.substring(0, 40)}{activity.description?.length > 40 ? '...' : ''}
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
                on:click|stopPropagation={() => openDetailDrawer(activity)} 
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700">
                Detail
              </button>
              <button
                on:click|stopPropagation={() => openEditModal(activity)}
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
              <button
                on:click|stopPropagation={() => handleDelete(activity.id)}
                class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Hapus
              </button>
            </div>
          </li>
        {/each}
      </ul>
      {#if activities.length > 0}
        <Pagination 
          currentPage={currentPage} 
          lastPage={lastPage} 
          onPageChange={goToPage} 
          totalItems={totalActivities} 
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
                Nama Aktivitas
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Project
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
                  <span class="text-xs text-gray-500">{activity.description?.substring(0, 40)}{activity.description?.length > 40 ? '...' : ''}</span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {activity.project?.name.substring(0, 25)}{activity.project?.name.length > 25 ? '...' : ''}
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
                  {#if (activity.jenis === 'Vendor' || activity.jenis === 'Customer') && activity.mitra}
                    {activity.mitra?.nama.substring(0, 25)}{activity.mitra?.nama.length > 25 ? '...' : ''}
                  {:else}
                    -
                  {/if}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td class="relative whitespace-nowrap px-3 py-4 text-left text-sm font-medium">
                  <div class="flex items-left space-x-2">
                    <button on:click={() => openDetailDrawer(activity)} class="text-yellow-600 hover:text-yellow-900" title="Detail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span class="sr-only">Detail, {activity.name}</span>
                    </button>
                    <button on:click|stopPropagation={() => openEditModal(activity)} title="Edit" class="text-blue-600 hover:text-blue-900">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
                      <span class="sr-only">Edit, {activity.name}</span>
                    </button>
                    <button on:click|stopPropagation={() => handleDelete(activity.id)} title="Delete" class="text-red-600 hover:text-red-900">
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
          currentPage={currentPage} 
          lastPage={lastPage} 
          onPageChange={goToPage} 
          totalItems={totalActivities} 
          itemsPerPage={10} 
        />
      {/if}
    </div>
  {/if}
{/if}

<Modal bind:show={showCreateModal} title="Form Aktivitas Baru" maxWidth="max-w-xl">
  <form on:submit|preventDefault={handleSubmitCreate}>
    <div class="space-y-4">
      <div>
        <label for="create_name" class="block text-sm/6 font-medium text-gray-900">Nama Aktivitas</label>
        <div class="mt-2">
          <input type="text" id="create_name" bind:value={form.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
        </div>
      </div>
      <div>
        <label for="create_project_id" class="block text-sm/6 font-medium text-gray-900">Project</label>
        <div class="mt-2">
          <select id="create_project_id" bind:value={form.project_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Project</option>
            {#each projects as project (project.id)}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div>
        <label for="create_jenis" class="block text-sm/6 font-medium text-gray-900">Jenis</label>
        <div class="mt-2">
          <select id="create_jenis" bind:value={form.jenis} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Jenis</option>
            {#each activityJenisList as jenis}
              <option value={jenis}>{jenis}</option>
            {/each}
          </select>
        </div>
      </div>
      {#if form.jenis === 'Customer'}
        <p class="text-sm text-gray-500">Customer akan otomatis dipilih berdasarkan Project.</p>
      {:else if form.jenis === 'Vendor'}
        <div>
          <label for="create_mitra_id_vendor" class="block text-sm/6 font-medium text-gray-900">Vendor</label>
          <div class="mt-2">
            <select id="create_mitra_id_vendor" bind:value={form.mitra_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Vendor</option>
              {#each vendors as vendor (vendor.id)}
                <option value={vendor.id}>{vendor.nama}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}
      <div>
        <label for="create_kategori" class="block text-sm/6 font-medium text-gray-900">Kategori</label>
        <div class="mt-2">
          <select id="create_kategori" bind:value={form.kategori} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            <option value="">Pilih Kategori</option>
            {#each activityKategoriList as kategori}
              <option value={kategori}>{kategori}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="create_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
          <div class="mt-2">
            <input id="create_from" bind:value={form.from} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="create_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
          <div class="mt-2">
            <input id="create_to" bind:value={form.to} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
          </div>
        </div>
      </div>
      <div>
        <label for="create_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
        <div class="mt-2">
          <textarea id="create_description" bind:value={form.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
        </div>
      </div>
      <div>
        <label for="create_activity_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Aktivitas</label>
        <div class="mt-2">
          <input type="date" id="create_activity_date" bind:value={form.activity_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
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
    </div>
    <div class="mt-6">
      <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        Tambah Aktivitas
      </button>
    </div>
  </form>
</Modal>

<Modal bind:show={showEditModal} title="Edit Aktivitas" maxWidth="max-w-xl">
  {#if editingActivity}
    <form on:submit|preventDefault={handleSubmitUpdate}>
      <div class="space-y-4">
        <div>
          <label for="edit_name" class="block text-sm/6 font-medium text-gray-900">Nama Aktivitas</label>
          <div class="mt-2">
            <input type="text" id="edit_name" bind:value={form.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_project_id" class="block text-sm/6 font-medium text-gray-900">Project</label>
          <div class="mt-2">
            <select id="edit_project_id" bind:value={form.project_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Project</option>
              {#each projects as project (project.id)}
                <option value={project.id}>{project.name}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label for="edit_jenis" class="block text-sm/6 font-medium text-gray-900">Jenis</label>
          <div class="mt-2">
            <select id="edit_jenis" bind:value={form.jenis} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Jenis</option>
              {#each activityJenisList as jenis}
                <option value={jenis}>{jenis}</option>
              {/each}
            </select>
          </div>
        </div>
        {#if form.jenis === 'Customer'}
          <p class="text-sm text-gray-500">Customer akan otomatis dipilih berdasarkan Project.</p>
        {:else if form.jenis === 'Vendor'}
          <div>
            <label for="edit_mitra_id_vendor" class="block text-sm/6 font-medium text-gray-900">Vendor</label>
            <div class="mt-2">
              <select id="edit_mitra_id_vendor" bind:value={form.mitra_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                <option value="">Pilih Vendor</option>
                {#each vendors as vendor (vendor.id)}
                  <option value={vendor.id}>{vendor.nama}</option>
                {/each}
              </select>
            </div>
          </div>
        {/if}
        <div>
          <label for="edit_kategori" class="block text-sm/6 font-medium text-gray-900">Kategori</label>
          <div class="mt-2">
            <select id="edit_kategori" bind:value={form.kategori} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Kategori</option>
              {#each activityKategoriList as kategori}
                <option value={kategori}>{kategori}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="edit_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
            <div class="mt-2">
              <input id="edit_from" bind:value={form.from} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
            <div class="mt-2">
              <input id="edit_to" bind:value={form.to} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
            </div>
          </div>
        </div>
        <div>
          <label for="edit_description" class="block text-sm/6 font-medium text-gray-900">Deskripsi</label>
          <div class="mt-2">
            <textarea id="edit_description" bind:value={form.description} rows="4" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="edit_activity_date" class="block text-sm/6 font-medium text-gray-900">Tanggal Aktivitas</label>
          <div class="mt-2">
            <input type="date" id="edit_activity_date" bind:value={form.activity_date} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <FileAttachment
          id="edit_attachment"
          label="Lampiran"
          bind:file={form.attachment}
          bind:fileName={formFileName}
          showRemoveButton={true}
          on:change={(e) => {
            form.attachment = e.detail.file;
            formFileName = e.detail.fileName;
          }}
          on:remove={() => {
            form.attachment_removed = true;
            form.attachment = null;
            formFileName = '';
          }}
        />
      </div>
      <div class="mt-6">
        <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Update Aktivitas
        </button>
      </div>
    </form>
  {/if}
</Modal>

<!-- Activity Detail Drawer -->
<Drawer 
  bind:show={showDetailDrawer} 
  title="Detail Activity"
  on:close={() => showDetailDrawer = false}
>
  <ActivityDetail activity={selectedActivity} />
</Drawer>