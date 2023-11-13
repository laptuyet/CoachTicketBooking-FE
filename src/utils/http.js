import axios from 'axios'

// const BASE_URL = 'https://coach-ticket-booking.onrender.com/api/v1/'
const BASE_URL = 'http://localhost:8080/api/v1';

const http = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10s
    headers: {
        "Content-Type": "application/json",
    }
})

http.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('acToken');
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
})

export { http }