// src/lib/axiosClient.ts
import axios from 'axios';
import { API_BASE_URL } from './config';

const axiosClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
});

// Interceptor untuk menambahkan token JWT
axiosClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('jwt_token'); // Atau dari cookie
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default axiosClient;
