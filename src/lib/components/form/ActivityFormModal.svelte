<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import FileAttachment from '$lib/components/FileAttachment.svelte';

  export let show: boolean = false;
  export let title: string = 'Form Aktivitas';
  export let submitLabel: string = 'Simpan';
  export let idPrefix: string = 'activity';
  export let allowRemoveAttachment: boolean = true;
  export let showProjectSelect: boolean = true;

  export let form: {
    name: string;
    short_desc: string;
    description: string;
    project_id: string | number | '';
    kategori: string | '';
    value: number;
    activity_date: string | '';
    jenis: string | '';
    mitra_id: number | string | '' | null;
    from?: string | '';
    to?: string | '';
    attachments?: File[];
    attachment_names?: string[];
    attachment_descriptions?: string[];
    existing_attachments?: Array<{ id: number; name: string; description?: string; url: string; size?: number; original_name?: string }>;
    removed_existing_ids?: number[];
  };

  // DEFINISI KATEGORI KEUANGAN
  const financeCategories = [
    'Expense Report', 'Invoice', 'Invoice & FP', 'Payment', 'Faktur Pajak', 'Kasbon'
  ];

  // Reactive: Cek apakah kategori yang dipilih user termasuk kategori keuangan
  $: showValueInput = form.kategori && financeCategories.includes(form.kategori);

  // Jika showValueInput false, reset form value ke 0
  $: if (!showValueInput) {
    form.value = 0;
  }

  // Reactive: Formatter untuk Preview Rupiah (agar user mudah baca nol-nya)
  $: formattedValuePreview = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2
  }).format(form.value || 0);

  const MAX_SHORT_DESC = 80;
  $: shortDescLen = form.short_desc?.length ?? 0;

  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  export let projects: Array<{
    id: number;
    name: string;
    mitra_id?: number | null;
    mitra?: { id: number; nama: string; is_customer?: boolean };
  }> = [];
  export let vendors: Array<{ id: number; nama: string }> = [];

  export let activityKategoriList: string[] = [];
  export let activityJenisList: string[] = [];

  export let onSubmit: () => Promise<void> | void;
  $: selectedProject = projects.find((p) => p.id === Number(form.project_id));

  let isSubmitting = false;
  async function handleSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;
    try { await onSubmit?.(); }
    finally { isSubmitting = false; }
  }
</script>

<Modal bind:show={show} {title} maxWidth="max-w-xl">
  {#if form.project_id}
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 dark:text-white">
      Project : {selectedProject?.name}
    </h1>
    <h1 class="text-center text-base font-bold tracking-tight text-gray-900 dark:text-white mb-6">
      Customer : {selectedProject?.mitra?.nama}
    </h1>
  {/if}

  <form on:submit|preventDefault={handleSubmit} autocomplete="off">
    <fieldset disabled={isSubmitting} class="space-y-4">
      <div>
        <label for="{idPrefix}_name" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama Aktivitas</label>
        <div class="mt-2">
          <input
            type="text"
            id="{idPrefix}_name"
            bind:value={form.name}
            required
            placeholder="Masukkan nama aktivitas"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      {#if showProjectSelect}
        <div>
          <label for="{idPrefix}_project_id" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Project</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_project_id"
              bind:value={form.project_id}
              required
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            >
              <option value="">Pilih Project</option>
              {#each projects as project (project.id)}
                <option value={project.id}>{project.name}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_jenis" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Jenis</label>
        <div class="mt-2">
          <select
            id="{idPrefix}_jenis"
            bind:value={form.jenis}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            <option value="">Pilih Jenis</option>
            {#each activityJenisList as jenis}
              <option value={jenis}>{jenis}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if form.jenis === 'Customer'}
        <p class="text-sm text-gray-500 dark:text-gray-400">Customer akan otomatis dipilih berdasarkan Project.</p>
      {:else if form.jenis === 'Vendor'}
        <div>
          <label for="{idPrefix}_mitra_id_vendor" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Vendor</label>
          <div class="mt-2">
            <select
              id="{idPrefix}_mitra_id_vendor"
              bind:value={form.mitra_id}
              required
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            >
              <option value="">Pilih Vendor</option>
              {#each vendors as vendor (vendor.id)}
                <option value={vendor.id}>{vendor.nama}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_kategori" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Kategori</label>
        <div class="mt-2">
          <select
            id="{idPrefix}_kategori"
            bind:value={form.kategori}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            <option value="">Pilih Kategori</option>
            {#each activityKategoriList as kategori}
              <option value={kategori}>{kategori}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="{idPrefix}_from" class="block text-sm/6 font-medium text-gray-900 dark:text-white">From (Optional)</label>
          <div class="mt-2">
            <input
              id="{idPrefix}_from"
              bind:value={form.from}
              placeholder="Dari"
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
        <div>
          <label for="{idPrefix}_to" class="block text-sm/6 font-medium text-gray-900 dark:text-white">To (Optional)</label>
          <div class="mt-2">
            <input
              id="{idPrefix}_to"
              bind:value={form.to}
              placeholder="Ke"
              class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
      </div>

      <div>
        <label for="{idPrefix}_short_desc" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Deskripsi Singkat (Max: 80 Karakter)</label>
        <div class="mt-2">
          <textarea
            id="{idPrefix}_short_desc"
            bind:value={form.short_desc}
            on:input={() => (form.short_desc = (form.short_desc ?? '').slice(0, MAX_SHORT_DESC))}
            rows="2"
            required
            maxlength={MAX_SHORT_DESC}
            placeholder="Masukkan deskripsi singkat"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          ></textarea>
          <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {shortDescLen}/{MAX_SHORT_DESC}
          </div>
        </div>
      </div>

      <div>
        <label for="{idPrefix}_description" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Deskripsi</label>
        <div class="mt-2">
          <textarea
            id="{idPrefix}_description"
            bind:value={form.description}
            rows="4"
            required
            placeholder="Masukkan deskripsi aktivitas"
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          ></textarea>
        </div>
      </div>

      {#if showValueInput}
        <div class="transition-all duration-300 ease-in-out bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <label for="activity_value" class="block text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-1">Nilai / Value (Rp)</label>
          <div class="relative rounded-md shadow-sm">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span class="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
            </div>
            
            <input 
              id="activity_value"
              type="number" 
              step="0.01"
              min="0"
              bind:value={form.value}
              class="block w-full py-1 rounded-md border-emerald-300 dark:border-emerald-700 pl-10 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              placeholder="0.00"
              required={showValueInput}
            />
          </div>
          <div class="mt-1 flex justify-between items-start">
            <p class="text-xs text-emerald-600 dark:text-emerald-500">
              Wajib diisi (Angka saja).
            </p>
            <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Terbaca: {formattedValuePreview}
            </p>
          </div>
        </div>
      {/if}

      <div>
        <label for="{idPrefix}_activity_date" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Tanggal Aktivitas</label>
        <div class="mt-2">
          <input
            type="date"
            id="{idPrefix}_activity_date"
            bind:value={form.activity_date}
            required
            class="block w-full rounded-md bg-white dark:bg-neutral-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <FileAttachment
        id="{idPrefix}_attachments"
        label="Lampiran"
        bind:files={form.attachments}
        bind:fileNames={form.attachment_names}
        bind:fileDescriptions={form.attachment_descriptions}
        maxFiles={10}
        showRemoveButton={allowRemoveAttachment}
      />

      {#if form.existing_attachments && form.existing_attachments.length > 0}
        <div class="mt-3 space-y-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white">Lampiran Lama</p>
          {#each form.existing_attachments as att (att.id)}
            <div class="rounded border px-3 py-2 text-sm dark:border-gray-700 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <a class="truncate text-indigo-600 dark:text-indigo-400 hover:underline" href={att.url} target="_blank" rel="noreferrer">
                  {att.original_name ?? att.name}
                </a>
              </div>
              <input type="text" bind:value={att.name} required placeholder="Nama lampiran" class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              <input type="text" bind:value={att.description} required placeholder="Deskripsi lampiran" class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              <div class="flex items-center justify-end gap-3">
                {#if att.size}<span class="text-gray-500 dark:text-gray-400">{formatFileSize(att.size)}</span>{/if}
                <button type="button" class="text-red-600 hover:text-red-700" on:click={() => {
                  form.removed_existing_ids = [...(form.removed_existing_ids ?? []), att.id];
                  form.existing_attachments = form.existing_attachments!.filter(x => x.id !== att.id);
                }}>Hapus</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </fieldset>

    <div class="mt-6">
      <button type="submit" class="flex w-full justify-center items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isSubmitting} aria-busy={isSubmitting}>
        {#if isSubmitting}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"></circle><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4"></path></svg>
          <span>Menyimpan...</span>
        {:else}
          {submitLabel}
        {/if}
      </button>
    </div>
  </form>
</Modal>

<style>
  :global(.break-all){ word-break: break-all; overflow-wrap: anywhere; }
  /* Hilangkan spinner bawaan browser pada input number agar lebih bersih */
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  input[type=number] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
</style>