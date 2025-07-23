<script lang="ts">
  import { goto } from '$app/navigation';
  import axiosClient from '$lib/axiosClient';

  let name = '';
  let email = '';
  let password = '';
  let password_confirmation = '';
  let error = '';

  async function handleSubmit() {
    error = ''; // Reset error message on new submission
    try {
      const response = await axiosClient.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation,
      });

      // Biasanya setelah register, pengguna perlu login secara terpisah atau API langsung mengembalikan token
      // Dalam kasus ini, diasumsikan register berhasil dan bisa langsung ke halaman login
      alert('Registrasi berhasil! Silakan login.');
      goto('/auth/login');
    } catch (err: any) {
      // Tangani error validasi dari Laravel
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        // Gabungkan semua pesan error validasi
        error = Object.values(apiErrors)
                    .flat() // flat() untuk menggabungkan array jika ada banyak error per field
                    .join('\n'); // Gabungkan dengan newline
      } else {
        error = err.response?.data?.message || 'Registrasi gagal. Coba lagi.';
      }
      console.error('Registration failed:', err.response || err);
    }
  }
</script>

<div class="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
    <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Daftar akun baru</h2>
  </div>

  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
    <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
      <div>
        <label for="name" class="block text-sm/6 font-medium text-gray-900">Nama Lengkap</label>
        <div class="mt-2">
          <input
            type="text"
            name="name"
            id="name"
            required
            bind:value={name}
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <div>
        <label for="email" class="block text-sm/6 font-medium text-gray-900">Email</label>
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
        <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
        <div class="mt-2">
          <input
            type="password"
            name="password"
            id="password"
            required
            bind:value={password}
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      <div>
        <label for="password_confirmation" class="block text-sm/6 font-medium text-gray-900">Konfirmasi Password</label>
        <div class="mt-2">
          <input
            type="password"
            name="password_confirmation"
            id="password_confirmation"
            required
            bind:value={password_confirmation}
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
          Daftar
        </button>
      </div>
    </form>

    <p class="mt-10 text-center text-sm/6 text-gray-500">
      Sudah punya akun?
      <a href="/auth/login" class="font-semibold text-indigo-600 hover:text-indigo-500">Login disini</a>
    </p>
  </div>
</div>