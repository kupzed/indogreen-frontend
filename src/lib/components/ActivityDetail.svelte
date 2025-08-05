<script lang="ts">
  export let activity: any = null;
  
  // Helper function for badge colors
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Completed': return 'text-green-800';
      case 'In Progress': return 'text-blue-800';
      case 'Pending': return 'text-yellow-800';
      case 'Cancelled': return 'text-red-800';
      default: return 'text-gray-800';
    }
  }
</script>

{#if activity}
  <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Activity</h3>
    </div>
    <div class="border-t border-gray-200">
      <dl class="divide-y divide-gray-100">
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Judul</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {activity.title}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Project</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if activity.project}
              {activity.project.name}
            {:else}
              -
            {/if}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Status</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getStatusBadgeClasses(activity.status)}">
              {activity.status}
            </span>
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {activity.description || '-'}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Tanggal Mulai</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if activity.start_date}
              {new Date(activity.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {:else}
              -
            {/if}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Tanggal Selesai</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {#if activity.end_date}
              {new Date(activity.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            {:else}
              -
            {/if}
          </dd>
        </div>
        <div class="bg-white px-4 py-2 mb-4 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
          <dt class="text-sm font-medium text-gray-500">Prioritas</dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {activity.priority || '-'}
          </dd>
        </div>
      </dl>
    </div>
  </div>
{/if} 