import axios from 'axios';
// Base API client configuration
export const apiClient = axios.create({
    baseURL: 'https://n8n-test.brandgrowthos.ai/webhook/b6f845bc-2d9c-43b2-8412-c81871c8bf89',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});
// Request interceptor for adding authorization tokens
apiClient.interceptors.request.use((config) => {
    // Token can be added here when needed
    // const token = getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor for handling errors
apiClient.interceptors.response.use((response) => response, (error) => {
    // Handle common errors here
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
});
