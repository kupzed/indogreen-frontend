<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';
  import BarangCertificatesDetail from '$lib/components/detail/BarangCertificatesDetail.svelte';

  type Mitra = { id: number; nama: string };

  let item: any = null;
  let loading = true;
  let error = '';

  // Dependencies
  let mitras: Mitra[] = [];

  // Edit state
  let showEditModal = false;
  let form: { name: string; no_seri: string; mitra_id: number | '' | null } = {
    name: '',
    no_seri: '',
    mitra_id: ''
  };

  $: id = $page.params.id;

  async function fetchDependencies() {
    try {
      const res = await axiosClient.get('/barang-certificate/getFormDependencies');
      mitras = res.data?.data?.mitras ?? res.data?.mitras ?? [];
    } catch (err) {
      // ignore
    }
  }

  async function fetchDetail() {
    loading = true;
    error = '';
    try {
      const res = await axiosClient.get(`/barang-certificates/${id}`);
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
      no_seri: item.no_seri ?? '',
      mitra_id: item.mitra_id ?? ''
    };
    showEditModal = true;
  }

  async function handleSubmitUpdate() {
    try {
      await axiosClient.put(`/barang-certificates/${id}`, form);
      alert('Data berhasil diperbarui!');
      showEditModal = false;
      await fetchDetail();
      goto(`/barang-certificates/${id}`);
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
      await axiosClient.delete(`/barang-certificates/${id}`);
      alert('Data berhasil dihapus!');
      goto('/barang-certificates');
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
          <span>No. Seri: {item.no_seri}</span>
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
        <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Barang Certificate</h3>
      </div>
      <div class="border-t border-gray-200">
        <BarangCertificatesDetail barangCertificates={item} />
      </div>
    </div>
  </div>

  <Modal bind:show={showEditModal} title="Edit Barang Certificate" maxWidth="max-w-xl">
    <form on:submit|preventDefault={handleSubmitUpdate}>
      <div class="space-y-4">
        <div>
          <label for="edit_name" class="block text-sm/6 font-medium text-gray-900">Nama</label>
          <div class="mt-2">
            <input id="edit_name" type="text" bind:value={form.name} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_no_seri" class="block text-sm/6 font-medium text-gray-900">No. Seri</label>
          <div class="mt-2">
            <input id="edit_no_seri" type="text" bind:value={form.no_seri} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
          </div>
        </div>
        <div>
          <label for="edit_mitra" class="block text-sm/6 font-medium text-gray-900">Mitra</label>
          <div class="mt-2">
            <select id="edit_mitra" bind:value={form.mitra_id} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
              <option value="">Pilih Mitra</option>
              {#each mitras as m}
                <option value={m.id}>{m.nama}</option>
              {/each}
            </select>
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
