/**
 * Natural Life World - Interactive Features
 * Makes all buttons and links functional
 */

document.addEventListener('DOMContentLoaded', function() {
    // Product Pages
    setupProductPages();
    
    // Shopping Cart
    setupShoppingCart();
    
    // Navigation Links
    setupNavLinks();
    
    // Shop Now and View All Products
    setupShopButtons();
    
    // Contact Form
    setupContactForm();
    
    // Newsletter Form
    setupNewsletterForm();
});

/**
 * Setup Product Pages
 */
function setupProductPages() {
    // Product cards and "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    
    if (addToCartButtons.length) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the product information
                const productCard = this.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('.product-price').textContent;
                
                // Show notification
                showNotification(`${productName} added to cart! ${productPrice}`);
                
                // Animate the cart icon (if exists)
                const cartIcon = document.querySelector('.nav-cta');
                if (cartIcon) {
                    cartIcon.classList.add('cart-pulse');
                    setTimeout(() => {
                        cartIcon.classList.remove('cart-pulse');
                    }, 1000);
                }
            });
        });
    }
    
    // Product detail view (when clicking on product cards)
    const productCards = document.querySelectorAll('.product-card');
    
    if (productCards.length) {
        productCards.forEach(card => {
            const productImage = card.querySelector('.product-image');
            const productTitle = card.querySelector('h3');
            
            // Make the product image and title clickable
            [productImage, productTitle].forEach(element => {
                if (element) {
                    element.style.cursor = 'pointer';
                    element.addEventListener('click', function() {
                        const productName = card.querySelector('h3').textContent;
                        // Simulate going to product detail page
                        window.location.hash = `product-${encodeURIComponent(productName.toLowerCase().replace(/\s+/g, '-'))}`;
                        showProductDetailModal(card);
                    });
                }
            });
        });
    }
}

/**
 * Setup Shopping Cart
 */
function setupShoppingCart() {
    const shopNowBtn = document.querySelector('.nav-cta');
    
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.hash = 'cart';
            showModal('Shopping Cart', `
                <div class="cart-modal">
                    <div class="cart-header">
                        <h3>Your Shopping Cart</h3>
                    </div>
                    <div class="cart-empty">
                        <p>Your cart is currently empty.</p>
                        <a href="#products" class="btn btn-primary">Continue Shopping</a>
                    </div>
                </div>
            `);
        });
    }
}

/**
 * Setup Navigation Links
 */
function setupNavLinks() {
    const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
    
    if (navLinks.length) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // If it's a hash link (internal page navigation)
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80, // Account for header height
                            behavior: 'smooth'
                        });
                    }
                    
                    // Update URL hash without scrolling
                    history.pushState(null, null, targetId);
                } else if (this.getAttribute('href') === '#') {
                    e.preventDefault();
                    showNotification('Page coming soon!');
                }
            });
        });
    }
}

/**
 * Setup Shop Buttons
 */
function setupShopButtons() {
    // Hero "Explore Products" button
    const exploreProductsBtn = document.querySelector('.hero-cta .btn-primary');
    if (exploreProductsBtn) {
        exploreProductsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const productsSection = document.getElementById('products');
            if (productsSection) {
                window.scrollTo({
                    top: productsSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // "View All Products" button
    const viewAllProductsBtn = document.querySelector('.section-footer .btn-primary');
    if (viewAllProductsBtn) {
        viewAllProductsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.hash = 'all-products';
            showNotification('Full product catalog coming soon!');
        });
    }
}

/**
 * Setup Contact Form
 */
function setupContactForm() {
    const contactFormLinks = document.querySelectorAll('a[href*="contact"]');
    
    if (contactFormLinks.length) {
        contactFormLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.hash = 'contact';
                
                showModal('Contact Us', `
                    <div class="contact-form">
                        <form id="contactForm">
                            <div class="form-group">
                                <label for="name">Your Name</label>
                                <input type="text" id="name" name="name" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="message">Message</label>
                                <textarea id="message" name="message" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Send Message</button>
                        </form>
                    </div>
                `);
                
                // Add event listener to the form
                const contactForm = document.getElementById('contactForm');
                if (contactForm) {
                    contactForm.addEventListener('submit', function(e) {
                        e.preventDefault();
                        showNotification('Your message has been sent! We\'ll get back to you soon.');
                        closeModal();
                    });
                }
            });
        });
    }
}

/**
 * Setup Newsletter Form
 */
function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            
            if (emailInput && emailInput.value) {
                showNotification('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            }
        });
    }
}

/**
 * Show Product Detail Modal
 */
function showProductDetailModal(productCard) {
    const productName = productCard.querySelector('h3').textContent;
    const productCategory = productCard.querySelector('.product-category').textContent;
    const productDescription = productCard.querySelector('p').textContent;
    const productPrice = productCard.querySelector('.product-price').textContent;
    const productImage = productCard.querySelector('.product-image img').src;
    
    showModal(productName, `
        <div class="product-detail">
            <div class="product-detail-image">
                <img src="${productImage}" alt="${productName}">
            </div>
            <div class="product-detail-info">
                <span class="product-category">${productCategory}</span>
                <h2>${productName}</h2>
                <p class="product-description">${productDescription}</p>
                <div class="product-meta">
                    <div class="product-price">${productPrice}</div>
                    <div class="product-quantity">
                        <label for="quantity">Quantity:</label>
                        <select id="quantity">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary btn-add-cart-detail">Add to Cart</button>
                
                <div class="product-tabs">
                    <div class="tab-header">
                        <button class="tab-btn active" data-tab="description">Description</button>
                        <button class="tab-btn" data-tab="ingredients">Ingredients</button>
                        <button class="tab-btn" data-tab="usage">How to Use</button>
                    </div>
                    <div class="tab-content">
                        <div class="tab-pane active" id="description">
                            <p>${productDescription}</p>
                        </div>
                        <div class="tab-pane" id="ingredients">
                            <p>Organic ingredients sourced from sustainable farms. No artificial additives, preservatives, or fillers.</p>
                        </div>
                        <div class="tab-pane" id="usage">
                            <p>For best results, follow recommended dosage. Consult with a healthcare professional before starting any supplement regimen.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    // Setup the tabs in the product detail modal
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Setup the Add to Cart button in the product detail modal
    const addToCartDetailBtn = document.querySelector('.btn-add-cart-detail');
    if (addToCartDetailBtn) {
        addToCartDetailBtn.addEventListener('click', function() {
            const quantity = document.getElementById('quantity').value;
            showNotification(`${productName} (${quantity}) added to cart!`);
            closeModal();
        });
    }
}

/**
 * Show Modal
 */
function showModal(title, content) {
    // Check if a modal already exists, remove it if so
    const existingModal = document.querySelector('.modal-container');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.classList.add('modal-container');
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modalContainer);
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    // Add animation class
    setTimeout(() => {
        modalContainer.classList.add('active');
    }, 10);
    
    // Close button functionality
    const closeButton = modalContainer.querySelector('.modal-close');
    const overlay = modalContainer.querySelector('.modal-overlay');
    
    closeButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

/**
 * Close Modal
 */
function closeModal() {
    const modalContainer = document.querySelector('.modal-container');
    
    if (modalContainer) {
        modalContainer.classList.remove('active');
        
        setTimeout(() => {
            modalContainer.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

/**
 * Show Notification
 */
function showNotification(message) {
    // Check if a notification already exists
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add active class after a small delay (for animation)
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('active');
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 