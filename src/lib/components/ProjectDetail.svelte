<script lang="ts">
  export let project: any = null;
  
  // Helper function for badge colors
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete': return 'text-green-800';
      case 'Ongoing': return 'text-blue-800';
      case 'Prospect': return 'text-yellow-800';
      case 'Cancel': return 'text-red-800';
      default: return 'text-gray-800';
    }
  }
</script>

{#if project}
  <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Project</h3>
    </div>
    <div class="border-t border-gray-200">
      <dl class="divide-y divide-gray-100">
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Nama Project</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {project.name}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Customer</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if project.mitra}
              {project.mitra.nama}
            {:else}
              -
            {/if}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Status</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(project.status)}">
              {project.status}
            </span>
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {project.description}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Tanggal Mulai</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 mb-4 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Tanggal Selesai</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if project.finish_date}
              {new Date(project.finish_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {:else}
              <span class="text-gray-500">Tanggal belum ditambahkan</span>
            {/if}
          </dd>
        </div>
      </dl>
    </div>
  </div>
{/if} 