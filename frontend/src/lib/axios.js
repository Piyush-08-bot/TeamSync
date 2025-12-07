import axios from 'axios';


export const axiosInstance = axios.create({
    baseURL: '/api', 
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});


axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            
            console.log('Unauthorized access - token may be invalid');
            
        }
        return Promise.reject(error);
    }
);