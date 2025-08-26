<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import CertificateFormModal from '$lib/components/form/CertificateFormModal.svelte';
  import CertificateDetail from '$lib/components/detail/CertificatesDetail.svelte';

  type Option = { id: number; name?: string; title?: string; no_seri?: string };

  let item: any = null;
  let loading = true;
  let error = '';

  // Dependencies
  let projects: Option[] = [];
  let barangCertificates: Option[] = [];
  let filteredBarangCertificates: Option[] = [];

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
    attachment_removed?: boolean;
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
      filteredBarangCertificates = [];
    } catch (err) {
      // ignore
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

  function closeEditModal() {
    showEditModal = false;
    filteredBarangCertificates = [];
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
    
    // Fetch barang certificates for the selected project
    if (item.project_id && typeof item.project_id === 'number') {
      fetchBarangCertificatesByProject(item.project_id);
    } else {
      filteredBarangCertificates = [];
    }
    
    showEditModal = true;
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('no_certificate', form.no_certificate);
    if (form.project_id !== '' && form.project_id !== null) fd.append('project_id', String(form.project_id));
    if (form.barang_certificate_id !== '' && form.barang_certificate_id !== null) fd.append('barang_certificate_id', String(form.barang_certificate_id));
    if (form.status) fd.append('status', form.status);
    fd.append('date_of_issue', form.date_of_issue || '');
    fd.append('date_of_expired', form.date_of_expired || '');
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
      closeEditModal();
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

<svelte:head>
  <title>Detail Sertifikat - Indogreen</title>
</svelte:head>

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
        <CertificateDetail certificates={item} />
      </div>
    </div>
  </div>

  <CertificateFormModal
    bind:show={showEditModal}
    title="Edit Certificate"
    submitLabel="Update"
    idPrefix="edit"
    {form}
    {projects}
    barangOptions={filteredBarangCertificates}
    statuses={Array.from(statuses)}
    handleProjectChange={handleProjectChange}
    bind:currentFileName={formFileName}
    allowRemoveAttachment={false}
    onSubmit={handleSubmitUpdate}
    onClose={closeEditModal}
  />
{/if}
