<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string = 'Attachment File';
  export let id: string = 'file-attachment';
  export let accept: string = 'image/*,application/pdf';
  export let file: File | null = null;
  export let fileName: string = '';
  export let placeholder: string = 'PNG, JPG, GIF up to 10MB';
  export let showRemoveButton: boolean = false;
  export let removeButtonText: string = 'Hapus File';
  export let currentFileText: string = 'File saat ini';
  export let selectedFileText: string = 'File terpilih';

  const dispatch = createEventDispatcher();

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const selectedFile = input.files && input.files[0] ? input.files[0] : null;
    file = selectedFile;
    fileName = selectedFile ? selectedFile.name : '';
    dispatch('change', { file: selectedFile, fileName });
  }

  function handleRemoveFile() {
    file = null;
    fileName = '';
    dispatch('remove', { file: null, fileName: '' });
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return '🖼️';
      default: return '📎';
    }
  }
</script>

<div class="file-attachment-container">
  <label for={id} class="block text-sm/6 font-medium text-gray-900 dark:text-white">
    {label} (Opsional)
  </label>
  
  <div class="mt-2">
    <!-- Area input file -->
    <div class="relative">
      <input
        {id}
        type="file"
        {accept}
        on:change={handleFileChange}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <!-- Custom UI -->
      <div
        class="border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200
               bg-white dark:bg-neutral-900 border-gray-300 hover:border-indigo-400 hover:bg-gray-50
               dark:border-gray-700 dark:hover:bg-neutral-800
               {fileName ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20' : ''}"
      >
        {#if fileName}
          <!-- Saat ada file -->
          <div class="flex items-center justify-center space-x-3">
            <span class="text-2xl">{getFileIcon(fileName)}</span>
            <div class="flex-1 text-left">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{fileName}</p>
              {#if file}
                <p class="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
              {/if}
              <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {showRemoveButton ? currentFileText : selectedFileText}: {fileName}
              </p>
            </div>
          </div>
        {:else}
          <!-- Empty state -->
          <div class="space-y-2">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 cursor-pointer">
                  Klik untuk upload file
                </span>
                atau drag & drop
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{placeholder}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Actions -->
    {#if fileName}
      <div class="mt-3 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {showRemoveButton ? 'File terlampir' : selectedFileText}
          </span>
        </div>
        <button 
          type="button" 
          on:click={handleRemoveFile}
          class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md
                 text-red-700 bg-red-100 hover:bg-red-200
                 dark:text-red-100 dark:bg-red-900 dark:hover:bg-red-800
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          {removeButtonText}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .file-attachment-container { width: 100%; }

  /* Hover efek drag & drop */
  .file-attachment-container:hover input[type="file"] + div {
    border-color: rgb(129 140 248);
    background-color: rgb(238 242 255);
  }

  /* Versi dark untuk hover di custom input (tanpa Tailwind) */
  @media (prefers-color-scheme: dark) {
    .file-attachment-container:hover input[type="file"] + div {
      border-color: rgb(99 102 241);
      background-color: rgba(49, 46, 129, 0.2);
    }
  }
</style>
