<script lang="ts">
  import { onMount } from 'svelte';
  import axiosClient from '$lib/axiosClient';

  let latestProjects: any[] = [];
  let latestActivities: any[] = [];
  let loading = true;
  let error = '';

  async function fetchDashboardData() {
    loading = true;
    error = '';
    try {
      const response = await axiosClient.get('/dashboard'); // Memanggil endpoint API
      latestProjects = response.data.data.latest_projects;
      latestActivities = response.data.data.latest_activities;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal mengambil data dashboard.';
      console.error('Error fetching dashboard data:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchDashboardData();
  });

  // Function to determine text color for project status badges
  function getProjectStatusBadgeClasses(status: string) {
    switch (status) {
      case 'Complete': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Ongoing': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'Prospect': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Cancel': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Indogreen</title>
</svelte:head>

{#if loading}
  <p class="text-gray-900 dark:text-white">Memuat data dashboard...</p>
{:else if error}
  <p class="text-red-500">{error}</p>
{:else}
  <div>
    <h2 class="text-2xl leading-6 font-medium text-gray-900 dark:text-white">Project Terbaru</h2>
    <div class="mt-4 bg-white dark:bg-black shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        {#if latestProjects.length === 0}
          <li class="px-4 py-4 sm:px-6">
            <p class="text-sm text-gray-500 dark:text-gray-300">Belum ada project terbaru.</p>
          </li>
        {:else}
          {#each latestProjects as project (project.id)}
            <li>
              <a href={`/projects/${project.id}`} class="block hover:bg-gray-50 dark:hover:bg-neutral-950">
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {project.name}
                    </p>
                    <div class="ml-2 flex-shrink-0 flex">
                      <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {getProjectStatusBadgeClasses(project.status)}">
                        {project.status} 
                      </span>
                      {#if project.is_cert_projects}
                        <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-purple-100 text-purple-800">
                          Certificate
                        </span>
                      {/if}
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500 dark:text-gray-300">
                        Customer: {project.mitra?.nama || '-'}
                        | Deskripsi: {project.description?.substring(0, 50)}{project.description?.length > 50 ? '...' : ''}
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300 sm:mt-0">
                      <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                      </svg>
                      <p>
                        Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-2xl leading-6 font-medium text-gray-900 dark:text-white">Aktivitas Terbaru</h2>
    <div class="mt-4 bg-white dark:bg-black shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        {#if latestActivities.length === 0}
          <li class="px-4 py-4 sm:px-6">
            <p class="text-sm text-gray-500 dark:text-gray-300">Belum ada aktivitas terbaru.</p>
          </li>
        {:else}
          {#each latestActivities as activity (activity.id)}
            <li>
              <a href={`/activities/${activity.id}`} class="block hover:bg-gray-50 dark:hover:bg-neutral-950">
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {activity.name}
                    </p>
                    <div class="ml-2 flex-shrink-0 flex">
                      <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300">
                        {activity.kategori}
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500 dark:text-gray-300">
                        Project: {activity.project?.name || '-'}
                        | Jenis: {activity.jenis}
                        {#if (activity.jenis === 'Vendor' || activity.jenis === 'Customer') && activity.mitra}
                          | {activity.jenis}: {activity.mitra.nama}
                        {/if}
                        | Deskripsi: {activity.description?.substring(0, 50)}{activity.description?.length > 50 ? '...' : ''}
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300 sm:mt-0">
                      <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                      </svg>
                      <p>
                        Aktivitas: {new Date(activity.activity_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>
{/if}