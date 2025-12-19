<script lang="ts">
  import { onMount } from 'svelte';
  import axiosClient from '$lib/axiosClient';

  let loading = false;
  let reportData: any[] = [];
  let meta = { total_records: 0, total_value: 0, period: '' };

  // Default ke bulan & tahun saat ini
  let selectedMonth = new Date().getMonth() + 1;
  let selectedYear = new Date().getFullYear();

  const months = [
    { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
    { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
  ];

  // GENERATE TAHUN: Mulai dari 2020 sampai tahun depan (agar tidak hardcoded 2026)
  const startYear = 2020;
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 1;
  // Membuat array range tahun
  const years = Array.from({ length: (endYear - startYear) + 1 }, (_, i) => startYear + i);

  async function fetchReport() {
    loading = true;
    try {
      const res = await axiosClient.get('/finance/monthly-report', {
        params: { month: selectedMonth, year: selectedYear }
      });
        reportData = res.data.data;
        meta = res.data.meta;
      } catch (e) {
        console.error(e);
        alert('Gagal mengambil laporan keuangan');
      } finally {
        loading = false;
      }
  }

  function formatRupiah(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  }

  onMount(() => {
    fetchReport();
  });
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Dokumen Keuangan</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm">Rekapitulasi aktivitas keuangan per bulan</p>
    </div>

    <div class="flex items-center gap-2 bg-white dark:bg-black p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <select bind:value={selectedMonth} on:change={fetchReport} class="form-select text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-black text-gray-900 dark:text-white">
        {#each months as m}
          <option value={m.val}>{m.label}</option>
        {/each}
      </select>
      <select bind:value={selectedYear} on:change={fetchReport} class="form-select text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-black text-gray-900 dark:text-white">
        {#each years as y}
          <option value={y}>{y}</option>
        {/each}
      </select>
      <button on:click={fetchReport} class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
        Refresh
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-white dark:bg-black p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-1">
      <p class="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">Total Nilai (Bulan Ini)</p>
      <h2 class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
        {formatRupiah(meta.total_value || 0)}
      </h2>
      <p class="text-xs text-gray-400 mt-1">Total {meta.total_records} transaksi</p>
    </div>
  </div>

  <div class="bg-white dark:bg-black shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left divide-y divide-gray-300 dark:divide-gray-700 border-collapse">
        <thead>
          <tr class="bg-gray-50 dark:bg-neutral-900 text-xs uppercase text-gray-500 dark:text-gray-300 font-semibold tracking-wider">
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">No</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Tanggal</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Kategori</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Activity</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Project</th>
            <th class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Nilai (IDR)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-200">
          {#if loading}
            <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</td></tr>
          {:else if reportData.length === 0}
            <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">Tidak ada data keuangan pada periode ini.</td></tr>
          {:else}
            {#each reportData as item, i}
              <tr class="hover:bg-gray-50 dark:hover:bg-neutral-950 transition-colors">
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                  {i + 1}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                  {item.activity_date}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {item.kategori}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                  {item.activity_name}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                  {item.project_name}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-right font-bold text-gray-800 dark:text-white font-mono">
                  {formatRupiah(item.value)}
                </td>
              </tr>
              {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>