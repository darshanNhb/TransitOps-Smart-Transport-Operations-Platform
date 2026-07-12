// ─────────────────────────────────────────────────────────────
// Centralized Axios Client & JWT Interceptor
// ─────────────────────────────────────────────────────────────
// Coordinates requests to the backend server.
// Implements request signing via Authorization Headers.
// Manages concurrency queues during token renewals (401 rotation).
// ─────────────────────────────────────────────────────────────

import axios from "axios";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const setAccessToken = (token) => {
    if (token) {
        localStorage.setItem("accessToken", token);
    } else {
        localStorage.removeItem("accessToken");
    }
};

export const getAccessToken = () => {
    return localStorage.getItem("accessToken");
};

// Request interceptor to append authorization bearer token
client.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to rotate tokens dynamically on 401
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/login") &&
            !originalRequest.url?.includes("/auth/register") &&
            !originalRequest.url?.includes("/auth/refresh")
        ) {
            // If already renewing, queue requests
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`;
                        return client(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh endpoint (attaches cookie natively via withCredentials)
                const res = await axios.post(
                    `${client.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = res.data.data;
                setAccessToken(accessToken);

                isRefreshing = false;
                processQueue(null, accessToken);

                originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
                return client(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError, null);

                // Clear tokens and dispatch global logout action
                setAccessToken(null);
                window.dispatchEvent(new CustomEvent("auth-logout"));
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default client;
