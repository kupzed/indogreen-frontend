<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import CertificatesDetail from '$lib/components/detail/CertificatesDetail.svelte';

  type Option = { id: number; name?: string; title?: string };

  let item: any = null;
  let loading = true;
  let error = '';

  // Dependencies
  let projects: Option[] = [];
  let barangCertificates: Option[] = [];

  // Edit state
  let showEditModal = false;
  let formFileName = '';
  let form: {
    name: string;
    no_certificate: string;
    project_id: number | '' | null;
    barang_certificate_id: number | '' | null;
    status: 'Belum' | 'Tidak Aktif' | 'Aktif' | '';
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

  const statuses = ['Belum', 'Tidak Aktif', 'Aktif'] as const;

  $: id = $page.params.id;

  async function fetchDependencies() {
    try {
      const res = await axiosClient.get('/certificate/getFormDependencies');
      projects = res.data?.data?.projects ?? res.data?.projects ?? [];
      barangCertificates = res.data?.data?.barang_certificates ?? res.data?.barang_certificates ?? [];
    } catch (err) {
      // ignore
    }
  }

  async function fetchDetail() {
    loading = true;
    error = '';
    try {
      const res = await axiosClient.get(`/certificates/${id}`);
      item = res.data?.data ?? res.data;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal memuat detail.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchDependencies();
    fetchDetail();
  });

  function openEditModal() {
    if (!item) return;
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
    showEditModal = true;
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

  async function handleSubmitUpdate() {
    try {
      const fd = buildFormData();
      fd.append('_method', 'PUT');
      await axiosClient.post(`/certificates/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Data berhasil diperbarui!');
      showEditModal = false;
      await fetchDetail();
      goto(`/certificates/${id}`);
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui data.';
      alert('Error:\n' + messages);
      console.error('Update failed:', err.response || err);
    }
  }

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      await axiosClient.delete(`/certificates/${id}`);
      alert('Data berhasil dihapus!');
      goto('/certificates');
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
      console.error('Delete failed:', err.response || err);
    }
  }
</script>

{#if loading}
  <p>Memuat detail...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else if !item}
  <p>Data tidak ditemukan.</p>
{:else}
  <div class="max-w-1xl mx-auto mb-8">
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-2xl">
          {item.name}
        </h2>
        <div class="my-2 text-sm text-gray-500">
          <span>No. Sertifikat: {item.no_certificate}</span>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 mb-4 md:mt-0 md:ml-4 md:mb-4 space-y-2 md:space-y-0 md:space-x-4">
        <button
          on:click={openEditModal}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit
        </button>
        <button
          on:click={handleDelete}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Hapus
        </button>
      </div>
    </div>

    <div class="bg-white shadow overflow-hidden">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Sertifikat</h3>
      </div>
      <div class="border-t border-gray-200">
        <CertificatesDetail certificates={item} />
      </div>
    </div>
  </div>

  <Modal bind:show={showEditModal} title="Edit Certificate" maxWidth="max-w-xl">
    <form on:submit|preventDefault={handleSubmitUpdate}>
      <div class="space-y-4">
        <div>
          <label for="edit_name" class="block text-sm/6 font-medium text-gray-900">Nama</label>
          <div class="mt-2">
            <input id="edit_name" type="text" bind:value={form.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_no_certificate" class="block text-sm/6 font-medium text-gray-900">No. Sertifikat</label>
          <div class="mt-2">
            <input id="edit_no_certificate" type="text" bind:value={form.no_certificate} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_project" class="block text-sm/6 font-medium text-gray-900">Project</label>
          <div class="mt-2">
            <select id="edit_project" bind:value={form.project_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Project</option>
              {#each projects as p}
                <option value={p.id}>{p.name ?? p.title}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label for="edit_barang_certificate" class="block text-sm/6 font-medium text-gray-900">Barang Certificate</label>
          <div class="mt-2">
            <select id="edit_barang_certificate" bind:value={form.barang_certificate_id} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Barang Certificate</option>
              {#each barangCertificates as b}
                <option value={b.id}>{b.name ?? b.title}</option>
              {/each}
            </select>
          </div>
        </div>
        <div>
          <label for="edit_status" class="block text-sm/6 font-medium text-gray-900">Status</label>
          <div class="mt-2">
            <select id="edit_status" bind:value={form.status} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Status</option>
              {#each statuses as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="edit_issue" class="block text-sm/6 font-medium text-gray-900">Tanggal Terbit</label>
            <div class="mt-2">
              <input id="edit_issue" type="date" bind:value={form.date_of_issue} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_expired" class="block text-sm/6 font-medium text-gray-900">Tanggal Expired</label>
            <div class="mt-2">
              <input id="edit_expired" type="date" bind:value={form.date_of_expired} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
        </div>
        <div>
          <label for="edit_attachment" class="block text-sm/6 font-medium text-gray-900">Lampiran (Opsional)</label>
          <div class="mt-2">
            <input
              id="edit_attachment"
              type="file"
              accept="image/*,application/pdf"
              on:change={(e: Event) => {
                const input = e.target as HTMLInputElement;
                const file = input.files && input.files[0] ? input.files[0] : null;
                form.attachment = file;
                formFileName = file ? file.name : '';
              }}
              class="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
            />
            {#if formFileName}
              <p class="text-xs text-gray-600 mt-1">File saat ini: {formFileName}</p>
            {/if}
          </div>
        </div>
      </div>
      <div class="mt-6">
        <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Update
        </button>
      </div>
    </form>
  </Modal>
{/if}
