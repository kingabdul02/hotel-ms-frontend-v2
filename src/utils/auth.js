export function isAuthenticated() {
    // Check if the user is authenticated
    // For example, you can check if there's a token in localStorage
    const token = localStorage.getItem('token');
    return !!token; // Convert token to boolean (true if token exists, false if not)
}

// auth.js
const ACCESS_TOKEN_KEY = 'access_token';

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}
