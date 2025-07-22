<script lang="ts">
  import { onMount } from 'svelte';
  import axiosClient from '$lib/axiosClient';
  import type { PageData } from './$types';

  export let data: PageData; // Data dari load function (+page.ts)

  let latestProjects: any[] = [];
  let latestActivities: any[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const response = await axiosClient.get('/dashboard'); // Memanggil endpoint API
      latestProjects = response.data.data.latest_projects;
      latestActivities = response.data.data.latest_activities;
    } catch (err: any) {
      error = err.response?.data?.message || 'Gagal mengambil data dashboard.';
      console.error(err);
    } finally {
      loading = false;
    }
  });
</script>

<h1>Dashboard</h1>

{#if loading}
  <p>Memuat data...</p>
{:else if error}
  <p style="color: red;">{error}</p>
{:else}
  <h2>Proyek Terbaru</h2>
  {#if latestProjects.length > 0}
    <ul>
      {#each latestProjects as project}
        <li>{project.name} - {project.status}</li>
      {/each}
    </ul>
  {:else}
    <p>Belum ada proyek terbaru.</p>
  {/if}

  <h2>Aktivitas Terbaru</h2>
  {#if latestActivities.length > 0}
    <ul>
      {#each latestActivities as activity}
        <li>{activity.name} ({activity.project?.name}) - {activity.kategori}</li>
      {/each}
    </ul>
  {:else}
    <p>Belum ada aktivitas terbaru.</p>
  {/if}
{/if}