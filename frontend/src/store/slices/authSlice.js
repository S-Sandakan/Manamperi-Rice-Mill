import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Load persisted state
const storedUser = localStorage.getItem('mrms_user');
const storedToken = localStorage.getItem('mrms_token');

const initialState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authAPI.login(credentials);
            const data = response.data.data;

            localStorage.setItem('mrms_token', data.token);
            localStorage.setItem('mrms_user', JSON.stringify({
                id: data.userId,
                username: data.username,
                fullName: data.fullName,
                role: data.role,
            }));

            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Login failed. Please try again.'
            );
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('mrms_token');
            localStorage.removeItem('mrms_user');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = {
                    id: action.payload.userId,
                    username: action.payload.username,
                    fullName: action.payload.fullName,
                    role: action.payload.role,
                };
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
