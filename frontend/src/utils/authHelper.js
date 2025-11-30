import { jwtDecode } from 'jwt-decode';

export function authHelper() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        return null;
    }
}
