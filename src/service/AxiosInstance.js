import axios from 'axios';
import store from '../store/store';
import { GET_USER_TOKEN_GETTER } from '../store/storeconstants';

// Create an Axios instance
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach the token to the headers
axiosInstance.interceptors.request.use(
    (config) => {
        // Retrieve the token from the store
        const token = store.getters[`auth/${GET_USER_TOKEN_GETTER}`];

        if (token) {
            // Attach the token to the Authorization header
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Handle the error
        return Promise.reject(error);
    }
);

export default axiosInstance;
