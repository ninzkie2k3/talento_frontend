import axios from "axios";

const axiosClient = axios.create({
    baseURL: "https://palegoldenrod-weasel-648342.hostingersite.com/api", // Update with your machine's IP address
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response } = error;
        if (response && response.status === 401) {
            localStorage.removeItem("ACCESS_TOKEN");
            // Optionally, redirect to login page
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
