<script lang="ts">
  export let mitra: any = null;
</script>

{#if mitra}
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
          <dt class="text-sm font-medium text-gray-500">Email</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {mitra.email || '-'}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Telepon</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {mitra.phone || '-'}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Alamat</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {mitra.address || '-'}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Tipe</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {mitra.type || '-'}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 mb-4 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Tanggal Dibuat</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if mitra.created_at}
              {new Date(mitra.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {:else}
              -
            {/if}
          </dd>
        </div>
      </dl>
    </div>
  </div>
{/if} 