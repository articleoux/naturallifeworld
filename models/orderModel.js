const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user']
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: [true, 'Order item must reference a product']
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: [true, 'Order item must have a quantity'],
          min: 1
        },
        image: String
      }
    ],
    shippingAddress: {
      name: String,
      addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required']
      },
      addressLine2: String,
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      zipCode: {
        type: String,
        required: [true, 'Zip code is required']
      },
      country: {
        type: String,
        required: [true, 'Country is required']
      },
      phone: String
    },
    billingAddress: {
      sameAsShipping: {
        type: Boolean,
        default: true
      },
      name: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer'],
      required: [true, 'Payment method is required']
    },
    paymentInfo: {
      transactionId: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
      },
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      paymentDate: Date
    },
    subtotal: {
      type: Number,
      required: [true, 'Order must have a subtotal']
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
      required: [true, 'Order must have a total']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    notes: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    refundedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    couponCode: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${randomStr}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Populate product details in items
orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email'
  });
  
  this.populate({
    path: 'items.product',
    select: 'name price images'
  });
  
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(status, options = {}) {
  this.status = status;
  
  switch (status) {
    case 'shipped':
      this.shippedAt = Date.now();
      this.trackingNumber = options.trackingNumber || this.trackingNumber;
      this.trackingUrl = options.trackingUrl || this.trackingUrl;
      this.estimatedDelivery = options.estimatedDelivery || this.estimatedDelivery;
      break;
    case 'delivered':
      this.deliveredAt = Date.now();
      break;
    case 'cancelled':
      this.cancelledAt = Date.now();
      break;
    case 'refunded':
      this.refundedAt = Date.now();
      break;
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 