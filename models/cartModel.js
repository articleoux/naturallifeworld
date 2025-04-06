const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    sessionId: {
      type: String,
      required: function() {
        return !this.user;
      }
    },
    items: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: [true, 'Cart item must reference a product']
        },
        quantity: {
          type: Number,
          required: [true, 'Cart item must have a quantity'],
          min: 1,
          default: 1
        }
      }
    ],
    subtotal: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    shippingAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    couponCode: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 24 * 60 * 60 // 30 days in seconds
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create unique index on either user or sessionId
cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

// Populate product details in cart items
cartSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'items.product',
    select: 'name price stock status images description shortDescription'
  });
  next();
});

// Update cart totals
cartSchema.methods.updateTotals = async function() {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((total, item) => {
    const price = item.product.price || 0;
    return total + price * item.quantity;
  }, 0);

  // Calculate tax (could be customized based on region)
  this.taxAmount = parseFloat((this.subtotal * 0.08).toFixed(2)); // Example: 8% tax

  // Calculate shipping (simplified example)
  this.shippingAmount = this.subtotal > 75 ? 0 : 5.99;

  // Apply coupon discount (simplified example)
  if (this.couponCode) {
    // Here you would validate the coupon against a coupon model
    // and apply the correct discount
    this.discountAmount = parseFloat((this.subtotal * 0.1).toFixed(2)); // Example: 10% discount
  } else {
    this.discountAmount = 0;
  }

  // Calculate total
  this.total = parseFloat(
    (this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount).toFixed(2)
  );

  this.updatedAt = Date.now();
  return this;
};

// Add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    item => item.product._id.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity if item already exists
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity
    });
  }

  // Update cart totals
  await this.updateTotals();
  return this.save();
};

// Update item quantity
cartSchema.methods.updateItem = async function(productId, quantity) {
  const existingItemIndex = this.items.findIndex(
    item => item.product._id.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    if (quantity > 0) {
      this.items[existingItemIndex].quantity = quantity;
    } else {
      // Remove item if quantity is 0 or negative
      this.items.splice(existingItemIndex, 1);
    }
  }

  // Update cart totals
  await this.updateTotals();
  return this.save();
};

// Remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product._id.toString() !== productId.toString()
  );

  // Update cart totals
  await this.updateTotals();
  return this.save();
};

// Clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.couponCode = undefined;
  this.subtotal = 0;
  this.taxAmount = 0;
  this.shippingAmount = 0;
  this.discountAmount = 0;
  this.total = 0;
  this.updatedAt = Date.now();
  
  return this.save();
};

// Apply coupon
cartSchema.methods.applyCoupon = async function(couponCode) {
  // Here you would validate the coupon against a coupon model
  // For now, we just store the code
  this.couponCode = couponCode;
  
  // Update cart totals
  await this.updateTotals();
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 