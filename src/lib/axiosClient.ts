// src/lib/axiosClient.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const axiosClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
});

axiosClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		if (browser) {
			const token = localStorage.getItem('jwt_token');
			if (token) {
				// Axios v1: gunakan setter
				config.headers.set?.('Authorization', `Bearer ${token}`);
			} else {
				config.headers.delete?.('Authorization');
			}
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors
axiosClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (browser && error.response?.status === 401) {
			// Token expired or invalid, clear localStorage and redirect to login
			localStorage.removeItem('jwt_token');
			goto('/auth/login');
		}
		return Promise.reject(error);
	}
);

export default axiosClient;
