<script lang="ts">
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';
  import { onMount } from 'svelte';
  
  onMount(() => {
    const token = axiosClient.defaults.headers.common['Authorization'];
    if (token) {
  goto('/dashboard');
    } else {
  goto('/auth/login');
    }
  });
</script>
  
  