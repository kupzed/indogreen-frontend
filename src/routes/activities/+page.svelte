<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';

  let activities: any[] = [];
  let projects: any[] = []; // For project dropdown in activity forms
  let vendors: any[] = []; // For vendor dropdown (if 'jenis' is vendor)
  let loading = true;
  let error = '';
  let search: string = '';
  let jenisFilter: string = '';
  let kategoriFilter: string = '';
  let currentPage: number = 1;
  let lastPage: number = 1;
  let totalActivities: number = 0;

  // Modal state for Create/Update
  let showCreateModal: boolean = false;
  let showEditModal: boolean = false;
  let editingActivity: any = null; // Data aktivitas yang sedang diedit

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
    'Faktur Pajak', 'Kasbon', 'Laporan Teknis', 'Surat Masuk', 'Surat Keluar'
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
  });

  function handleFilterOrSearch() {
    currentPage = 1; // Reset halaman saat filter/search berubah
    fetchActivities();
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

<h1 class="text-2xl font-semibold text-gray-900 mb-4">Daftar Aktivitas</h1>

<div class="flex justify-between items-center mb-6">
  <div class="flex space-x-2">
    <select bind:value={jenisFilter} on:change={handleFilterOrSearch} class="px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
      <option value="">Filter Jenis: Semua</option>
      {#each activityJenisList as jenis}
        <option value={jenis}>{jenis}</option>
      {/each}
    </select>
    <select bind:value={kategoriFilter} on:change={handleFilterOrSearch} class="px-3 py-2 rounded-md text-sm font-semibold bg-white text-gray-900 border border-gray-300">
      <option value="">Filter Kategori: Semua</option>
      {#each activityKategoriList as kategori}
        <option value={kategori}>{kategori}</option>
      {/each}
    </select>
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
        placeholder="Cari aktivitas..."
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
    Tambah Aktivitas
  </button>
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
            <span class="font-medium">{(currentPage - 1) * 10 + activities.length}</span>
            of
            <span class="font-medium">{totalActivities}</span>
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
      <div>
        <label for="create_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
        <div class="mt-2">
          <textarea id="create_from" bind:value={form.from} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
        </div>
      </div>
      <div>
        <label for="create_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
        <div class="mt-2">
          <textarea id="create_to" bind:value={form.to} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
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
      <div>
        <label for="create_attachment" class="block text-sm/6 font-medium text-gray-900">Attachment File</label>
        <div class="mt-2">
          <input type="file" id="create_attachment" accept="image/*,application/pdf" on:change={handleAttachmentChange} class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" />
          {#if formFileName}
            <p class="text-xs text-gray-600 mt-1">File terpilih: {formFileName}</p>
          {/if}
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
        <div>
          <label for="edit_from" class="block text-sm/6 font-medium text-gray-900">From (Optional)</label>
          <div class="mt-2">
            <textarea id="edit_from" bind:value={form.from} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
          </div>
        </div>
        <div>
          <label for="edit_to" class="block text-sm/6 font-medium text-gray-900">To (Optional)</label>
          <div class="mt-2">
            <textarea id="edit_to" bind:value={form.to} rows="1" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
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
        <div>
          <label for="edit_attachment" class="block text-sm/6 font-medium text-gray-900">Attachment File</label>
          <div class="mt-2">
            <input type="file" id="edit_attachment" accept="image/*,application/pdf" on:change={handleAttachmentChange} class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" />
            {#if formFileName}
              <p class="text-xs text-gray-600 mt-1">File saat ini: {formFileName}</p>
              <button type="button" on:click={() => { form.attachment_removed = true; form.attachment = null; formFileName = ''; }} class="text-red-600 text-xs mt-1">Hapus File</button>
            {:else}
              <p class="text-xs text-gray-600 mt-1">Tidak ada file. PNG, JPG, GIF up to 10MB</p>
            {/if}
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