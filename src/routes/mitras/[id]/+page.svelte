<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import Modal from '$lib/components/Modal.svelte';

  let mitraId: string | null = null;
  let mitra: any = null;
  let loadingMitra = true;
  let errorMitra = '';

  // Modal state for Update
  let showEditModal: boolean = false;

  // Form data for Update
  let form = {
    nama: '',
    is_pribadi: false,
    is_perusahaan: false,
    is_customer: false,
    is_vendor: false,
    alamat: '',
    website: '',
    email: '',
    kontak_1: '',
    kontak_1_nama: '',
    kontak_1_jabatan: '',
    kontak_2: '',
    kontak_2_nama: '',
    kontak_2_jabatan: '',
  };

  let editingMitra: any = true;

  const mitraKategoriOptions = ['Pribadi', 'Perusahaan', 'Customer', 'Vendor'];

  async function fetchMitraDetails() {
    loadingMitra = true;
    errorMitra = '';
    mitraId = $page.params.id;
    if (!mitraId) {
      errorMitra = 'Mitra ID tidak ditemukan.';
      loadingMitra = false;
      return;
    }
    try {
      const response = await axiosClient.get(`/mitras/${mitraId}`);
      mitra = response.data.data;

      // Pre-fill edit mitra form
      form = { ...mitra };

    } catch (err: any) {
      errorMitra = err.response?.data?.message || 'Gagal memuat detail mitra.';
      console.error('Error fetching mitra details:', err.response || err);
    } finally {
      loadingMitra = false;
    }
  }

  onMount(() => {
    fetchMitraDetails();
  });

  function openEditModal() {
    showEditModal = true;
  }

  async function handleSubmitUpdate() {
    if (!mitra?.id) return;
    try {
      await axiosClient.put(`/mitras/${mitra.id}`, form);
      alert('Mitra berhasil diperbarui!');
      goto(`/mitras/${mitra.id}`);
      showEditModal = false;
      fetchMitraDetails(); // Refresh details
    } catch (err: any) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Gagal memperbarui mitra.';
      alert('Error:\n' + messages);
      console.error('Update mitra failed:', err.response || err);
    }
  }

  async function handleDelete() {
    if (!mitra?.id) return;
    if (confirm('Apakah Anda yakin ingin menghapus mitra ini?')) {
      try {
        await axiosClient.delete(`/mitras/${mitra.id}`);
        alert('Mitra berhasil dihapus!');
        goto('/mitras'); // Redirect to mitra list
      } catch (err: any) {
        alert('Gagal menghapus mitra: ' + (err.response?.data?.message || 'Terjadi kesalahan'));
        console.error('Delete mitra failed:', err.response || err);
      }
    }
  }

  // Helper for badge colors
  function getKategoriBadgeColor(kategori: string) {
    switch (kategori) {
      case 'Pribadi': return 'bg-red-900';
      case 'Perusahaan': return 'bg-green-900';
      case 'Customer': return 'bg-blue-900';
      case 'Vendor': return 'bg-gray-900';
      default: return 'bg-gray-500';
    }
  }
</script>


{#if loadingMitra}
  <p>Memuat detail mitra...</p>
{:else if errorMitra}
  <p class="text-red-500">{errorMitra}</p>
{:else if mitra}
  <div class="max-w-1xl mx-auto mb-8">
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-2xl">
          {mitra.nama}
        </h2>
        <div class="my-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="my-2 flex items-center text-sm text-gray-500">
            {#if mitra.is_pribadi}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Pribadi')} text-white mr-1">Pribadi</span>{/if}
            {#if mitra.is_perusahaan}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Perusahaan')} text-white mr-1">Perusahaan</span>{/if}
            {#if mitra.is_customer}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Customer')} text-white mr-1">Customer</span>{/if}
            {#if mitra.is_vendor}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Vendor')} text-white mr-1">Vendor</span>{/if}
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row mt-2 mb-4 md:mt-0 md:ml-4 md:mb-4 space-y-2 md:space-y-0 md:space-x-4">
        <button
          on:click={openEditModal}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit Mitra
        </button>
        <button
          on:click={handleDelete}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Hapus Mitra
        </button>
      </div>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Mitra</h3>
      </div>
      <div class="border-t border-gray-200">
        <dl class="divide-y divide-gray-100">
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Nama</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {mitra.nama}
            </dd>
          </div>
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Kategori</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if mitra.is_pribadi}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Pribadi')} text-white mr-1">Pribadi</span>{/if}
              {#if mitra.is_perusahaan}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Perusahaan')} text-white mr-1">Perusahaan</span>{/if}
              {#if mitra.is_customer}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Customer')} text-white mr-1">Customer</span>{/if}
              {#if mitra.is_vendor}<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getKategoriBadgeColor('Vendor')} text-white mr-1">Vendor</span>{/if}
            </dd>
          </div>
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Alamat</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {mitra.alamat}
            </dd>
          </div>
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Website</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {mitra.website || '-'}
            </dd>
          </div>
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Email</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {mitra.email}
            </dd>
          </div>
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Kontak 1</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {mitra.kontak_1}<br>
              <span class="text-xs text-gray-500">Nama: {mitra.kontak_1_nama} | Jabatan: {mitra.kontak_1_jabatan}</span>
            </dd>
          </div>
          <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">Kontak 2</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if mitra.kontak_2}
                {mitra.kontak_2}<br>
                <span class="text-xs text-gray-500">Nama: {mitra.kontak_2_nama} | Jabatan: {mitra.kontak_2_jabatan}</span>
              {:else}
                -
              {/if}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
{/if}

  <Modal bind:show={showEditModal} title="Edit Mitra" maxWidth="max-w-xl">
    {#if mitra}
      <form on:submit|preventDefault={handleSubmitUpdate}>
        <div class="space-y-4">
          <div>
            <label for="edit_mitra_nama" class="block text-sm/6 font-medium text-gray-900">Nama</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_nama" bind:value={form.nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm/6 font-medium text-gray-900">Kategori</label>
            <div class="flex flex-wrap gap-4 mt-2">
              <label><input type="checkbox" bind:checked={form.is_pribadi} class="mr-1"> Pribadi</label>
              <label><input type="checkbox" bind:checked={form.is_perusahaan} class="mr-1"> Perusahaan</label>
              <label><input type="checkbox" bind:checked={form.is_customer} class="mr-1"> Customer</label>
              <label><input type="checkbox" bind:checked={form.is_vendor} class="mr-1"> Vendor</label>
            </div>
          </div>
          <div>
            <label for="edit_mitra_alamat" class="block text-sm/6 font-medium text-gray-900">Alamat</label>
            <div class="mt-2">
              <textarea id="edit_mitra_alamat" bind:value={form.alamat} rows="2" required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"></textarea>
            </div>
          </div>
          <div>
            <label for="edit_mitra_website" class="block text-sm/6 font-medium text-gray-900">Website</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_website" bind:value={form.website} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_email" class="block text-sm/6 font-medium text-gray-900">Email</label>
            <div class="mt-2">
              <input type="email" id="edit_mitra_email" bind:value={form.email} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_1" class="block text-sm/6 font-medium text-gray-900">Kontak 1 (No. Telp/HP)</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_1" bind:value={form.kontak_1} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_1_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 1</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_1_nama" bind:value={form.kontak_1_nama} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_1_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 1</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_1_jabatan" bind:value={form.kontak_1_jabatan} required class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_2" class="block text-sm/6 font-medium text-gray-900">Kontak 2 (No. Telp/HP)</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_2" bind:value={form.kontak_2} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_2_nama" class="block text-sm/6 font-medium text-gray-900">Nama Kontak 2</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_2_nama" bind:value={form.kontak_2_nama} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
          <div>
            <label for="edit_mitra_kontak_2_jabatan" class="block text-sm/6 font-medium text-gray-900">Jabatan Kontak 2</label>
            <div class="mt-2">
              <input type="text" id="edit_mitra_kontak_2_jabatan" bind:value={form.kontak_2_jabatan} class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
            </div>
          </div>
        </div>
        <div class="mt-6">
          <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Update Mitra
          </button>
        </div>
      </form>
    {/if}
  </Modal>