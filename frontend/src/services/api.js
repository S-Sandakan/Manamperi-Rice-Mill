import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Add auth token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
};

// Products
export const productsAPI = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getLowStock: () => api.get('/products/low-stock'),
};

// Farmers
export const farmersAPI = {
    getAll: () => api.get('/farmers'),
    getById: (id) => api.get(`/farmers/${id}`),
    create: (data) => api.post('/farmers', data),
    update: (id, data) => api.put(`/farmers/${id}`, data),
    delete: (id) => api.delete(`/farmers/${id}`),
};

// Customers
export const customersAPI = {
    getAll: () => api.get('/customers'),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// Paddy Purchases
export const paddyAPI = {
    getAll: () => api.get('/paddy'),
    create: (data) => api.post('/paddy', data),
    getStats: () => api.get('/paddy/stats'),
};

// Sales
export const salesAPI = {
    getAll: (params) => api.get('/sales', { params }),
    getById: (id) => api.get(`/sales/${id}`),
    create: (data) => api.post('/sales', data),
    getTodayStats: () => api.get('/sales/today'),
};

// Rice Bran
export const branAPI = {
    getStock: () => api.get('/bran/stock'),
    updateStock: (data) => api.put('/bran/stock', data),
    addStock: (data) => api.post('/bran/stock/add', data),
    getSales: () => api.get('/bran/sales'),
    createSale: (data) => api.post('/bran/sales', data),
};

// Inventory
export const inventoryAPI = {
    getDashboard: () => api.get('/inventory'),
    getMovements: (params) => api.get('/inventory/movements', { params }),
};

// Reports
export const reportsAPI = {
    getDashboard: () => api.get('/reports/dashboard'),
    salesReport: (params) => api.get('/reports/sales', { params }),
    purchaseReport: (params) => api.get('/reports/purchases', { params }),
    profitReport: (params) => api.get('/reports/profit', { params }),
};

export default api;
