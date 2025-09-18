import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

// baca preferensi awal dari localStorage atau default ke 'light'
const initial: Theme =
	typeof localStorage !== 'undefined' && localStorage.getItem('theme')
		? (localStorage.getItem('theme') as Theme)
		: 'light';

export const theme = writable<Theme>(initial);

// fungsi untuk toggle
export function toggleTheme() {
	theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}

// setiap kali tema berubah, update kelas html + localStorage
theme.subscribe((value) => {
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', value === 'dark');
	}
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('theme', value);
	}
});
