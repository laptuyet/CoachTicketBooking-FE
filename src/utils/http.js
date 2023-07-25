import axios from 'axios'

export const http = axios.create({
    baseURL: 'http://localhost:8080/api/v1/',
    timeout: 10000, // 10s
    headers: {
        "Content-Type": "application/json",
    }
})