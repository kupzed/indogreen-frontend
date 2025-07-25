<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';

  let activityId: string | null = null;
  let activity: any = null;
  let projects: any[] = []; // For project dropdown in activity forms
  let customers: any[] = []; // For customer dropdown (if 'jenis' is customer)
  let vendors: any[] = []; // For vendor dropdown (if 'jenis' is vendor)
  let loadingActivity = true;
  let errorActivity = '';

  // Modal state for Update
  let showEditModal: boolean = false;

  // Form data for Update
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

  async function fetchActivityDetails() {
    loadingActivity = true;
    errorActivity = '';
    activityId = $page.params.id;
    if (!activityId) {
      errorActivity = 'Activity ID tidak ditemukan.';
      loadingActivity = false;
      return;
    }
    try {
      const response = await axiosClient.get(`/activities/${activityId}`);
      activity = response.data.data;

      // Pre-fill edit activity form
      form = {
        name: activity.name,
        description: activity.description,
        project_id: activity.project_id || '',
        kategori: activity.kategori || '',
        activity_date: activity.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '',
        attachment: null, // Clear file input for edit, new file will replace
        jenis: activity.jenis || '',
        mitra_id: activity.mitra_id || null,
        from: activity.from || '',
        to: activity.to || '',
        attachment_removed: false,
      };
      formFileName = activity.attachment ? activity.attachment.split('/').pop() : ''; // Display current attachment name

    } catch (err: any) {
      errorActivity = err.response?.data?.message || 'Gagal memuat detail aktivitas.';
      console.error('Error fetching activity details:', err.response || err);
    } finally {
      loadingActivity = false;
    }
  }

  async function fetchFormDependencies() {
    try {
      const response = await axiosClient.get('/activity/getFormDependencies');
      projects = response.data.projects;
      customers = response.data.customers;
      vendors = response.data.mitras;
    } catch (err) {
      console.error('Failed to fetch form dependencies:', err);
    }
  }

  onMount(() => {
    fetchActivityDetails();
    fetchFormDependencies();
  });

  function openEditModal() {
    showEditModal = true;
  }

  function handleAttachmentChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      form.attachment = target.files[0];
      formFileName = target.files[0].name;
      form.attachment_removed = false;
    } else {
      form.attachment = null;
      formFileName = '';
      if (activity?.attachment) { // Only set removed flag if there was an existing attachment
        form.attachment_removed = true;
      }
    }
  }

  async function handleSubmitUpdate() {
    if (!activity?.id) return;
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
        const selectedProject = projects.find(p => p.id == form.project_id);
        if (selectedProject?.customer_id) { // Assuming project model has customer_id
          formData.set('mitra_id', selectedProject.customer_id);
        } else {
          formData.delete('mitra_id');
        }
      } else if (form.jenis === 'Vendor' && form.mitra_id) {
        formData.set('mitra_id', form.mitra_id);
      } else {
        formData.delete('mitra_id');
      }

      formData.append('_method', 'PUT'); // For Laravel to recognize PUT with FormData

      await axiosClient.post(`/activities/${activity.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Aktivitas berhasil diperbarui!');
      goto(`/activities/${activity.id}`);
      showEditModal = false;
      fetchActivityDetails(); // Refresh details
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui aktivitas.';
      alert('Error:\n' + messages);
      console.error('Update activity failed:', err.response || err);
    }
  }

  async function handleDelete() {
    if (!activity?.id) return;
    if (confirm('Apakah Anda yakin ingin menghapus aktivitas ini?')) {
      try {
        await axiosClient.delete(`/activities/${activity.id}`);
        alert('Aktivitas berhasil dihapus!');
        goto('/activities'); // Redirect to activity list
      } catch (err: any) {
        alert('Gagal menghapus aktivitas: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete activity failed:', err.response || err);
      }
    }
  }

  // Reactive logic for mitra_id dropdown in forms
  $: if (form.jenis && projects.length > 0) { // Add projects.length check to ensure data is loaded
    if (form.jenis === 'Customer') {
      const selectedProject = projects.find(p => p.id == form.project_id);
      form.mitra_id = selectedProject?.mitra_id || null; // Using mitra_id from Project model as customer_id
    } else if (form.jenis === 'Internal') {
      form.mitra_id = '1'; // Hardcode for internal partner
    } else if (form.jenis === 'Vendor') {
      // Ensure mitra_id is valid for vendors, clear if not
      if (!vendors.some(v => v.id == form.mitra_id)) { // Use == for loose comparison as id might be string or number
          form.mitra_id = '';
      }
    } else {
      form.mitra_id = null;
    }
  }
</script>

<h1 class="text-2xl font-semibold text-gray-900 mb-4">Detail Aktivitas</h1>

{#if loadingActivity}
  <p>Memuat detail aktivitas...</p>
{:else if errorActivity}
  <p class="text-red-500">{errorActivity}</p>
{:else if activity}
  <div class="max-w-1xl mx-auto mb-8">
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-2xl">
          {activity.name}
        </h2>
        <div class="my-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="my-2 flex items-center text-sm text-gray-500">
            <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            Aktivitas: {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div class="my-2 flex items-center text-sm text-gray-900">
            <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 text-gray-900">
              {activity.kategori}
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 mb-4 md:mt-0 md:ml-4 md:mb-4 space-y-2 md:space-y-0 md:space-x-4">
        <button
          on:click={openEditModal}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit Aktivitas
        </button>
        <button
          on:click={handleDelete}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Hapus Aktivitas
        </button>
      </div>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Aktivitas</h3>
      </div>
      <div class="border-t border-gray-200">
        <dl class="divide-y divide-gray-100">
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Nama Aktivitas</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {activity.name}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Project</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if activity.project}
                <a href={`/projects/${activity.project.id}`} class="text-indigo-600 hover:text-indigo-900">
                  {activity.project.name}
                </a>
              {:else}
                <span class="text-gray-500">Project tidak ditemukan</span>
              {/if}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Jenis</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {activity.jenis}
            </dd>
          </div>
          {#if (activity.jenis === 'Customer' || activity.jenis === 'Vendor') && activity.mitra}
            <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt class="text-sm font-medium text-gray-500">{activity.jenis}</dt>
              <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`/mitras/${activity.mitra.id}`} class="text-indigo-600 hover:text-indigo-900">{activity.mitra.nama}</a>
              </dd>
            </div>
          {/if}
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Kategori</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 text-gray-900">
                {activity.kategori}
              </span>
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">From</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {activity.from || '-'}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">To</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {activity.to || '-'}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {activity.description}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Tanggal Aktivitas</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Attachment</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if activity.attachment}
                <a href={`/storage/${activity.attachment}`} target="_blank" class="text-indigo-600 hover:underline">{activity.attachment.split('/').pop()}</a>
              {:else}
                <span class="text-gray-500">Tidak ada file</span>
              {/if}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
{/if}

<Modal bind:show={showEditModal} title="Edit Aktivitas" maxWidth="max-w-xl">
  {#if activity}
    <form on:submit|preventDefault={handleSubmitUpdate}>
      <div class="space-y-4">
        <div>
          <label for="edit_activity_name" class="block text-sm font-medium text-gray-900">Nama Aktivitas</label>
          <input type="text" id="edit_activity_name" bind:value={form.name} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label for="edit_activity_project_id" class="block text-sm font-medium text-gray-900">Project</label>
          <select id="edit_activity_project_id" bind:value={form.project_id} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Pilih Project</option>
            {#each projects as project (project.id)}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="edit_activity_jenis" class="block text-sm font-medium text-gray-900">Jenis</label>
          <select id="edit_activity_jenis" bind:value={form.jenis} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Pilih Jenis</option>
            {#each activityJenisList as jenis}
              <option value={jenis}>{jenis}</option>
            {/each}
          </select>
        </div>
        {#if form.jenis === 'Customer'}
          <p class="text-sm text-gray-500">Customer akan otomatis dipilih berdasarkan Project.</p>
        {:else if form.jenis === 'Vendor'}
          <div>
            <label for="edit_activity_mitra_id_vendor" class="block text-sm font-medium text-gray-900">Vendor</label>
            <select id="edit_activity_mitra_id_vendor" bind:value={form.mitra_id} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Pilih Vendor</option>
              {#each vendors as vendor (vendor.id)}
                <option value={vendor.id}>{vendor.nama}</option>
              {/each}
            </select>
          </div>
        {/if}
        <div>
          <label for="edit_activity_kategori" class="block text-sm font-medium text-gray-900">Kategori</label>
          <select id="edit_activity_kategori" bind:value={form.kategori} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Pilih Kategori</option>
            {#each activityKategoriList as kategori}
              <option value={kategori}>{kategori}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="edit_activity_from" class="block text-sm font-medium text-gray-900">From (Optional)</label>
          <textarea id="edit_activity_from" bind:value={form.from} rows="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label for="edit_activity_to" class="block text-sm font-medium text-gray-900">To (Optional)</label>
          <textarea id="edit_activity_to" bind:value={form.to} rows="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label for="edit_activity_description" class="block text-sm font-medium text-gray-900">Deskripsi</label>
          <textarea id="edit_activity_description" bind:value={form.description} rows="4" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label for="edit_activity_date" class="block text-sm font-medium text-gray-900">Tanggal Aktivitas</label>
          <input type="date" id="edit_activity_date" bind:value={form.activity_date} required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label for="edit_attachment_file" class="block text-sm font-medium text-gray-900">Attachment File</label>
          <input type="file" id="edit_attachment_file" accept="image/*,application/pdf" on:change={handleAttachmentChange} class="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" />
          {#if formFileName}
            <p class="text-xs text-gray-600 mt-1">File saat ini: {formFileName}</p>
            <button type="button" on:click={() => { form.attachment_removed = true; form.attachment = null; formFileName = ''; }} class="text-red-600 text-xs mt-1">Hapus File</button>
          {:else}
            <p class="text-xs text-gray-600 mt-1">Tidak ada file. PNG, JPG, GIF up to 10MB</p>
          {/if}
        </div>
      </div>
      <div class="mt-6 flex justify-end">
        <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Update Aktivitas
        </button>
      </div>
    </form>
  {/if}
</Modal>