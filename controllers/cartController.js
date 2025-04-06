const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get user cart
exports.getCart = catchAsync(async (req, res, next) => {
  let cart;
  
  // If user is logged in, find by user id
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price imageCover stock slug category'
    });
  } 
  // If user is not logged in, find by session id
  else if (req.cookies.sessionId) {
    cart = await Cart.findOne({ sessionId: req.cookies.sessionId }).populate({
      path: 'items.product',
      select: 'name price imageCover stock slug category'
    });
  }

  // If no cart exists, create an empty one
  if (!cart) {
    if (req.user) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    } else {
      // Generate a session ID if not already present
      const sessionId = req.cookies.sessionId || 
        require('crypto').randomBytes(16).toString('hex');
      
      // Set session ID cookie if not already set
      if (!req.cookies.sessionId) {
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
      
      cart = await Cart.create({ sessionId, items: [] });
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

// Add item to cart
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  
  // Validate product ID
  if (!productId) {
    return next(new AppError('Please provide a product ID', 400));
  }
  
  // Verify product exists and has sufficient stock
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (product.stock < quantity) {
    return next(new AppError('Not enough stock available', 400));
  }
  
  let cart;
  
  // Find the user's cart
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else if (req.cookies.sessionId) {
    cart = await Cart.findOne({ sessionId: req.cookies.sessionId });
  }
  
  // Create a new cart if one doesn't exist
  if (!cart) {
    if (req.user) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Generate a session ID if not already present
      const sessionId = req.cookies.sessionId || 
        require('crypto').randomBytes(16).toString('hex');
      
      // Set session ID cookie if not already set
      if (!req.cookies.sessionId) {
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
      
      cart = await Cart.create({
        sessionId,
        items: [{ product: productId, quantity }]
      });
    }
  } else {
    // Use the addItem method from the cart model
    await cart.addItem(productId, quantity);
  }
  
  // Populate the cart items with product details
  await cart.populate({
    path: 'items.product',
    select: 'name price imageCover stock slug category'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

// Update cart item quantity
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity) {
    return next(new AppError('Please provide product ID and quantity', 400));
  }
  
  // Validate quantity
  if (quantity <= 0) {
    return next(new AppError('Quantity must be greater than 0', 400));
  }
  
  // Verify product exists and has sufficient stock
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (product.stock < quantity) {
    return next(new AppError('Not enough stock available', 400));
  }
  
  // Find the user's cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else if (req.cookies.sessionId) {
    cart = await Cart.findOne({ sessionId: req.cookies.sessionId });
  }
  
  if (!cart) {
    return next(new AppError('No cart found', 404));
  }
  
  // Use the updateItemQuantity method from the cart model
  await cart.updateItemQuantity(productId, quantity);
  
  // Populate the cart items with product details
  await cart.populate({
    path: 'items.product',
    select: 'name price imageCover stock slug category'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

// Remove item from cart
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  if (!productId) {
    return next(new AppError('Please provide a product ID', 400));
  }
  
  // Find the user's cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else if (req.cookies.sessionId) {
    cart = await Cart.findOne({ sessionId: req.cookies.sessionId });
  }
  
  if (!cart) {
    return next(new AppError('No cart found', 404));
  }
  
  // Use the removeItem method from the cart model
  await cart.removeItem(productId);
  
  // Populate the cart items with product details
  await cart.populate({
    path: 'items.product',
    select: 'name price imageCover stock slug category'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

// Clear cart
exports.clearCart = catchAsync(async (req, res, next) => {
  // Find the user's cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else if (req.cookies.sessionId) {
    cart = await Cart.findOne({ sessionId: req.cookies.sessionId });
  }
  
  if (!cart) {
    return next(new AppError('No cart found', 404));
  }
  
  // Use the clearCart method from the cart model
  await cart.clearCart();
  
  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

// Apply coupon to cart
exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.body;
  
  if (!couponCode) {
    return next(new AppError('Please provide a coupon code', 400));
  }
  
  // Find the user's cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id });
  } else if (req.cookies.sessionId) {
    cart = await Cart.findOne({ sessionId: req.cookies.sessionId });
  }
  
  if (!cart) {
    return next(new AppError('No cart found', 404));
  }
  
  // Use the applyCoupon method from the cart model
  const applied = await cart.applyCoupon(couponCode);
  
  if (!applied) {
    return next(new AppError('Invalid or expired coupon code', 400));
  }
  
  // Populate the cart items with product details
  await cart.populate({
    path: 'items.product',
    select: 'name price imageCover stock slug category'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

// Transfer guest cart to user cart after login
exports.transferCart = catchAsync(async (req, res, next) => {
  const { sessionId } = req.cookies;
  
  if (!sessionId || !req.user) {
    return next();
  }
  
  // Find the guest cart
  const guestCart = await Cart.findOne({ sessionId });
  
  if (!guestCart || guestCart.items.length === 0) {
    return next();
  }
  
  // Find or create user cart
  let userCart = await Cart.findOne({ user: req.user.id });
  
  if (!userCart) {
    userCart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Transfer items from guest cart to user cart
  for (const item of guestCart.items) {
    // Check if product already exists in user cart
    const existingItem = userCart.items.find(
      i => i.product.toString() === item.product.toString()
    );
    
    if (existingItem) {
      // Update quantity if product already exists
      await userCart.updateItemQuantity(
        item.product, 
        existingItem.quantity + item.quantity
      );
    } else {
      // Add item if product doesn't exist
      await userCart.addItem(item.product, item.quantity);
    }
  }
  
  // Delete the guest cart
  await Cart.findOneAndDelete({ sessionId });
  
  // Clear session ID cookie
  res.clearCookie('sessionId');
  
  next();
}); 