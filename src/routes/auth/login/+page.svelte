<script lang="ts">
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';

  let email = '';
  let password = '';
  let showPassword = false;
  let loading = false;
  let error: string | null = null;

  async function handleSubmit() {
    if (loading) return;
    error = null;
    loading = true;
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      // Backend bisa mengirim access_token atau token
      const token = res?.data?.access_token ?? res?.data?.token;
      if (!token) throw new Error('Token tidak ditemukan');
      localStorage.setItem('jwt_token', token);
      goto('/dashboard');
    } catch (err: any) {
      error =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Login gagal. Cek kredensial Anda.';
      console.error('Login failed:', err?.response || err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Indogreen</title>
</svelte:head>

<!-- Background dekoratif -->
<div class="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-cyan-50"></div>
<div class="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl">
  <div class="relative left-1/2 aspect-[1155/678] w-[36rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-300 to-cyan-300 opacity-30"></div>
</div>

<div class="min-h-screen flex items-center justify-center px-6">
  <div class="w-full max-w-md">
    <!-- Kartu form -->
    <div class="mt-8 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-xl shadow-indigo-100/20 backdrop-blur">
      <form class="space-y-5" on:submit|preventDefault={handleSubmit} aria-busy={loading}>
        <!-- Judul -->
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900">Login</h2>
        </div>
        <!-- Email -->
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <div class="relative">
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Alamat Email"
              bind:value={email}
              autocomplete="email"
              required
              class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70"
              disabled={loading}
            />
            <!-- ikon input -->
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0z"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364 6.364l-1.414-1.414M6.05 6.05 4.636 4.636"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Password -->
        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <!-- <a href="/auth/forgot" class="text-xs font-medium text-indigo-600 hover:text-indigo-500">Lupa password?</a> -->
          </div>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              bind:value={password}
              autocomplete="current-password"
              required
              class="peer block w-full rounded-xl border border-gray-300 bg-white px-11 py-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70"
              disabled={loading}
            />

            <!-- ikon kunci kiri -->
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 15v2m-6 1h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"/><path d="M8 11V7a4 4 0 118 0v4"/>
              </svg>
            </div>

            <!-- tombol mata kanan -->
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
              on:click={() => (showPassword = !showPassword)}
              disabled={loading}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {#if showPassword}
                <!-- eye -->
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              {:else}
                <!-- eye-off -->
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0113.41 13.4"/><path d="M9.88 4.64A9.94 9.94 0 0112 4c6.5 0 10 8 10 8a17.61 17.61 0 01-4.21 5.32"/><path d="M6.11 6.11A17.64 17.64 0 002 12s3.5 7 10 7a9.94 9.94 0 004.12-.83"/>
                </svg>
              {/if}
            </button>
          </div>
        </div>

        {#if error}
          <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        {/if}

        <button
          type="submit"
          class="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={loading}
          aria-disabled={loading}
        >
          {#if loading}
            <!-- Spinner -->
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>Masuk...</span>
          {:else}
            <span>Masuk</span>
            <svg class="h-4 w-4 opacity-90 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?
        <a href="/auth/register" class="font-semibold text-indigo-600 hover:text-indigo-500">Daftar disini</a>
      </p>
    </div>
  </div>
</div>