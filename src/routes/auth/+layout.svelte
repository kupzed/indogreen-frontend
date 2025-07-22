<script lang="ts">
  // Anda bisa menambahkan script untuk CSS atau logic global spesifik untuk halaman auth
  // Misalnya, mengimport app.css global jika styling Tailwind CSS diimport di sana
  import '../../app.css'; 
</script>

<main class="min-h-screen bg-gray-100">
  <slot></slot>
</main>

<style>
  /* Anda bisa menambahkan gaya CSS global di sini jika diperlukan */
</style>