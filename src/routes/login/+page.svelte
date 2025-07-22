<script lang="ts">
  import axiosClient from '$lib/axiosClient'; // Jika menggunakan axios
  import { goto } from '$app/navigation'; // Untuk navigasi setelah login

  let email = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    error = '';
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { access_token, expires_in } = response.data;

      // Simpan token di localStorage atau cookie
      localStorage.setItem('jwt_token', access_token);
      // Anda bisa menyimpan expires_in untuk refresh otomatis jika diperlukan

      alert('Login berhasil!');
      goto('/dashboard'); // Navigasi ke halaman dashboard
    } catch (err: any) {
      error = err.response?.data?.error || 'Login gagal. Cek kredensial Anda.';
      console.error(err);
    }
  }
</script>

<h1>Login</h1>
<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="email">Email:</label>
    <input type="email" id="email" bind:value={email} required />
  </div>
  <div>
    <label for="password">Password:</label>
    <input type="password" id="password" bind:value={password} required />
  </div>
  {#if error}
    <p style="color: red;">{error}</p>
  {/if}
  <button type="submit">Login</button>
</form>