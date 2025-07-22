<script lang="ts">
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';

  let email = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    error = ''; // Reset error message on new submission
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { access_token } = response.data;

      // Simpan token di localStorage
      localStorage.setItem('jwt_token', access_token);

      alert('Login berhasil!');
      goto('/dashboard'); // Arahkan ke halaman dashboard
    } catch (err: any) {
      // Tangani error dari API
      error = err.response?.data?.error || err.response?.data?.message || 'Login gagal. Cek kredensial Anda.';
      console.error('Login failed:', err.response || err);
    }
  }
</script>

<div class="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
    <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Sign in to your account</h2>
  </div>

  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
    <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
      <div>
        <label for="email" class="block text-sm/6 font-medium text-gray-900">Email address</label>
        <div class="mt-2">
          <input
            type="email"
            name="email"
            id="email"
            autocomplete="email"
            required
            bind:value={email}
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
        </div>
        <div class="mt-2">
          <input
            type="password"
            name="password"
            id="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      {#if error}
        <div class="text-red-500 text-sm">
          <p>{error}</p>
        </div>
      {/if}

      <div>
        <button
          type="submit"
          class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign in
        </button>
      </div>
    </form>

    <p class="mt-10 text-center text-sm/6 text-gray-500">
      Belum punya akun?
      <a href="/auth/register" class="font-semibold text-indigo-600 hover:text-indigo-500">Daftar disini</a>
    </p>
  </div>
</div>