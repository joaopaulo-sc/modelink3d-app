import axios from "axios";

function getBaseURL() {
  if (typeof window === "undefined") {
    // Lado servidor (SSR/middleware): usa URL interna do Docker
    return process.env.API_INTERNAL_URL || "http://backend:8000";
  }
  // Lado cliente: deriva o IP do hostname atual do browser, porta 8000
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
}

export const api = axios.create({ baseURL: getBaseURL() });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      logout();
    }
    return Promise.reject(err);
  }
);

export const login = async (email: string, password: string) => {
  const form = new URLSearchParams({ username: email, password });
  const { data } = await api.post("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  localStorage.setItem("token", data.access_token);
  // grava também em cookie para o middleware Next.js conseguir ler server-side
  document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0";
  window.location.href = "/app";
};

export const changePassword = async (current_password: string, new_password: string) => {
  await api.post("/auth/change-password", { current_password, new_password });
};
