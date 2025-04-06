/**
 * Natural Life World - Admin Authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginAlert = document.getElementById('login-alert');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already logged in
    checkAuthStatus();
});

/**
 * Handle login form submission
 * @param {Event} e - Form submission event
 */
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.querySelector('input[name="remember"]').checked;
    
    // Simple validation
    if (!email || !password) {
        showAlert('Please enter both email and password.', 'danger');
        return;
    }
    
    // In a real application, you would make an API call to your backend
    // For demo purposes, we'll use a hardcoded admin user
    if (email === 'admin@naturallifeworld.com' && password === 'admin123') {
        // Success - store authentication token
        const authToken = generateDemoToken(email);
        const expiryDate = remember ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null; // 30 days if remember
        
        setAuthToken(authToken, expiryDate);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        showAlert('Invalid email or password. Please try again.', 'danger');
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        return false;
    }
    
    try {
        // In a real application, you would verify the token
        // For demo purposes, we'll just check if it exists
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check authentication status and redirect if needed
 */
function checkAuthStatus() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath.endsWith('/admin/');
    
    if (isAuthenticated()) {
        // If user is logged in but on login page, redirect to dashboard
        if (isLoginPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // If user is not logged in and not on login page, redirect to login
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    }
}

/**
 * Store authentication token
 * @param {string} token - JWT token
 * @param {Date|null} expiryDate - Token expiry date
 */
function setAuthToken(token, expiryDate) {
    localStorage.setItem('auth_token', token);
    
    if (expiryDate) {
        localStorage.setItem('auth_expiry', expiryDate.toISOString());
    } else {
        localStorage.removeItem('auth_expiry');
    }
}

/**
 * Clear authentication token (logout)
 */
function clearAuthToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expiry');
}

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger)
 */
function showAlert(message, type = 'danger') {
    const loginAlert = document.getElementById('login-alert');
    
    if (loginAlert) {
        loginAlert.textContent = message;
        loginAlert.className = `alert alert-${type}`;
        loginAlert.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            loginAlert.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Generate a demo token for testing
 * @param {string} email - User email
 * @returns {string} Demo JWT token
 */
function generateDemoToken(email) {
    // This is NOT a secure token, just a demo
    // In a real application, your backend would generate a proper JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        sub: '1',
        email: email,
        name: 'Admin User',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }));
    const signature = btoa('demo_signature');
    
    return `${header}.${payload}.${signature}`;
}

/**
 * Logout user
 */
function logout() {
    clearAuthToken();
    window.location.href = 'index.html';
}

// Export functions for use in other scripts
window.adminAuth = {
    isAuthenticated,
    logout,
    checkAuthStatus
}; 