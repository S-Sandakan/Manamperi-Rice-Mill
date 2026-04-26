import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mrms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('mrms_token');
            localStorage.removeItem('mrms_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ===== AUTH API =====
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
};

// ===== DASHBOARD API =====
export const dashboardAPI = {
    getData: () => api.get('/dashboard'),
};

// ===== PURCHASES API =====
export const purchaseAPI = {
    getAll: (params) => api.get('/purchases', { params }),
    create: (data) => api.post('/purchases', data),
    getById: (id) => api.get(`/purchases/${id}`),
};

// ===== SUPPLIERS API =====
export const supplierAPI = {
    getAll: () => api.get('/suppliers'),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    getPriceHistory: (id) => api.get(`/suppliers/${id}/price-history`),
};

// ===== PRODUCTION API =====
export const productionAPI = {
    getBatches: (params) => api.get('/production/batches', { params }),
    createBatch: (data) => api.post('/production/batches', data),
    completeBatch: (id, data) => api.put(`/production/batches/${id}/complete`, data),
};

// ===== INVENTORY API =====
export const inventoryAPI = {
    getStock: () => api.get('/inventory/stock'),
    adjustStock: (data) => api.post('/inventory/adjust', data),
    getMovements: (productId) => api.get(`/inventory/movements/${productId}`),
    getLowStock: () => api.get('/inventory/low-stock'),
};

// ===== PRODUCTS API =====
export const productAPI = {
    getAll: () => api.get('/products'),
    getSaleable: () => api.get('/products/saleable'),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// ===== SALES API =====
export const salesAPI = {
    create: (data) => api.post('/sales', data),
    getAll: (params) => api.get('/sales', { params }),
    getById: (id) => api.get(`/sales/${id}`),
    voidSale: (id, reason) => api.put(`/sales/${id}/void`, { reason }),
    getInvoicePdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// ===== REPORTS API =====
export const reportAPI = {
    getDailySales: (date) => api.get('/reports/daily-sales', { params: { date } }),
    getMonthlySales: (month, year) => api.get('/reports/monthly-sales', { params: { month, year } }),
    getProductionEfficiency: (params) => api.get('/reports/production-efficiency', { params }),
    getProfitAnalysis: (params) => api.get('/reports/profit-analysis', { params }),
    getStockReport: () => api.get('/reports/stock'),
    getPurchaseHistory: (params) => api.get('/reports/purchase-history', { params }),
    exportPdf: (type, params) => api.get(`/reports/${type}/pdf`, { params, responseType: 'blob' }),
    exportExcel: (type, params) => api.get(`/reports/${type}/excel`, { params, responseType: 'blob' }),
};

// ===== USERS API =====
export const userAPI = {
    getAll: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    resetPassword: (id, data) => api.put(`/users/${id}/password`, data),
    toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
};

export default api;
