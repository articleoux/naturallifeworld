/**
 * Natural Life World - Admin Panel JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin UI
    initAdminUI();
    
    // Handle common admin interactions
    setupEventListeners();
    
    // Check authentication status
    if (window.adminAuth) {
        window.adminAuth.checkAuthStatus();
    }
});

/**
 * Initialize admin UI elements
 */
function initAdminUI() {
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Highlight active navigation item
    highlightActiveNav();
    
    // Initialize any date pickers
    initDatePickers();
    
    // Initialize rich text editors if available
    initRichTextEditors();
}

/**
 * Set up general admin event listeners
 */
function setupEventListeners() {
    // Logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink && window.adminAuth) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.adminAuth.logout();
        });
    }
    
    // Delete confirmation dialogs
    setupDeleteConfirmations();
    
    // Form submission handlers
    setupFormHandlers();
    
    // Image upload previews
    setupImageUploads();
}

/**
 * Highlight the current active navigation item based on URL
 */
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find the matching nav link and add active class
    let activeLink;
    
    if (filename === '' || filename === 'index.html') {
        activeLink = document.querySelector('.nav-link[href="index.html"]');
    } else if (filename === 'dashboard.html' || filename === '') {
        activeLink = document.querySelector('.nav-link[href="dashboard.html"]');
    } else {
        // Handle other pages - look for partial matches
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && filename.includes(href.replace('.html', ''))) {
                activeLink = link;
            }
        });
    }
    
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

/**
 * Setup delete confirmation for delete buttons
 */
function setupDeleteConfirmations() {
    const deleteButtons = document.querySelectorAll('.btn-danger');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const confirmDelete = confirm('Are you sure you want to delete this item? This action cannot be undone.');
            
            if (!confirmDelete) {
                e.preventDefault();
                return false;
            }
            
            // In a real application, you would handle the delete API call here
            // For demo purposes, we'll just show an alert
            alert('Item deleted successfully!');
            
            // Remove the table row if applicable
            const tableRow = this.closest('tr');
            if (tableRow) {
                tableRow.remove();
            }
        });
    });
}

/**
 * Setup form submission handlers
 */
function setupFormHandlers() {
    const adminForms = document.querySelectorAll('form[data-admin-form]');
    
    adminForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const formAction = form.getAttribute('data-action');
            
            // In a real application, you would make an API call here
            // For demo purposes, we'll just show a success message
            showNotification(`${formAction} saved successfully!`, 'success');
            
            // If there's a redirect path, navigate there
            const redirectPath = form.getAttribute('data-redirect');
            if (redirectPath) {
                setTimeout(() => {
                    window.location.href = redirectPath;
                }, 1500);
            }
        });
    });
}

/**
 * Setup image upload previews
 */
function setupImageUploads() {
    const imageUploads = document.querySelectorAll('input[type="file"][data-preview]');
    
    imageUploads.forEach(input => {
        const previewId = input.getAttribute('data-preview');
        const previewElement = document.getElementById(previewId);
        
        if (previewElement) {
            input.addEventListener('change', function(e) {
                const file = this.files[0];
                
                if (file) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        
                        // Clear previous preview
                        previewElement.innerHTML = '';
                        previewElement.appendChild(img);
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
        }
    });
}

/**
 * Initialize date picker inputs
 * Note: This is a placeholder - in a real app you'd use a proper date picker library
 */
function initDatePickers() {
    const datePickers = document.querySelectorAll('input[type="date"]');
    
    // In a real application, you would initialize a date picker library here
    // For demo purposes, we'll just use the native date input
}

/**
 * Initialize rich text editors
 * Note: This is a placeholder - in a real app you'd use a proper rich text editor
 */
function initRichTextEditors() {
    const richTextAreas = document.querySelectorAll('textarea[data-rich-editor]');
    
    // In a real application, you would initialize a rich text editor here
    // For example: TinyMCE, Quill, or TipTap
    // For demo purposes, we'll just use a placeholder
    richTextAreas.forEach(textarea => {
        // Add a placeholder class to style it differently
        textarea.classList.add('rich-editor-placeholder');
    });
}

/**
 * Show notification message
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() {
        notification.remove();
    });
    
    notification.appendChild(closeBtn);
    notificationContainer.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Format currency value
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

/**
 * Format date value
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(dateObj);
}

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} URL-friendly slug
 */
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

// Export utilities for use in other scripts
window.adminUtils = {
    showNotification,
    formatCurrency,
    formatDate,
    generateSlug
}; 