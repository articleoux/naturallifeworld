const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create checkout session with Stripe
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the current user's cart
  const cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price imageCover'
  });

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  // 2) Create line items for Stripe
  const lineItems = cart.items.map(item => {
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: [`${req.protocol}://${req.get('host')}/img/products/${item.product.imageCover}`]
        },
        unit_amount: item.product.price * 100
      },
      quantity: item.quantity
    };
  });

  // 3) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get('host')}/cart`,
    customer_email: req.user.email,
    client_reference_id: req.user.id,
    mode: 'payment',
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB']
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 1000,
            currency: 'usd',
          },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 5,
            },
            maximum: {
              unit: 'business_day',
              value: 7,
            },
          }
        }
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 2000,
            currency: 'usd',
          },
          display_name: 'Express Shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 2,
            },
            maximum: {
              unit: 'business_day',
              value: 3,
            },
          }
        }
      }
    ]
  });

  // 4) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

// Create order from Stripe webhook
exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    await createOrderCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
});

// Create order after successful checkout
const createOrderCheckout = async session => {
  const userId = session.client_reference_id;
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  
  if (!cart) return;

  // Extract shipping details
  const shippingAddress = {
    addressLine1: session.shipping_details.address.line1,
    addressLine2: session.shipping_details.address.line2 || '',
    city: session.shipping_details.address.city,
    state: session.shipping_details.address.state,
    postalCode: session.shipping_details.address.postal_code,
    country: session.shipping_details.address.country
  };

  // Extract payment details
  const paymentInfo = {
    id: session.payment_intent,
    method: 'card',
    amount: session.amount_total / 100,
    currency: session.currency,
    status: session.payment_status
  };

  // Create order items from cart
  const orderItems = cart.items.map(item => {
    return {
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.imageCover
    };
  });

  // Create new order
  await Order.create({
    user: userId,
    items: orderItems,
    shippingAddress,
    billingAddress: shippingAddress, // Use shipping as billing for simplicity
    paymentMethod: 'card',
    paymentInfo,
    subtotal: cart.subtotal,
    taxAmount: cart.taxAmount,
    shippingAmount: cart.shippingAmount,
    discountAmount: cart.discountAmount,
    total: cart.total,
    status: 'paid'
  });

  // Clear the user's cart
  await Cart.findOneAndDelete({ user: userId });

  // Update product stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity }
    });
  }
};

// Get all orders (admin only)
exports.getAllOrders = factory.getAll(Order);

// Get user orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders
    }
  });
});

// Get single order
exports.getOrder = catchAsync(async (req, res, next) => {
  let query = Order.findById(req.params.id);

  // If user is not admin, ensure they only see their own orders
  if (req.user.role !== 'admin') {
    query = query.find({ user: req.user.id });
  }

  const order = await query;

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Update order status (admin only)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Please provide a status', 400));
  }

  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  order.status = status;
  
  // Update status timestamps based on the new status
  if (status === 'processing') order.processingAt = Date.now();
  if (status === 'shipped') order.shippedAt = Date.now();
  if (status === 'delivered') order.deliveredAt = Date.now();
  if (status === 'cancelled') order.cancelledAt = Date.now();

  await order.save();

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Cancel order
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  // Admin can cancel any order, users can only cancel their own orders
  if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to cancel this order', 403));
  }

  // Can only cancel if order is pending or processing
  if (!['pending', 'processing'].includes(order.status)) {
    return next(new AppError(`Order cannot be cancelled when status is ${order.status}`, 400));
  }

  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  await order.save();

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Get order statistics (admin only)
exports.getOrderStats = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        numOrders: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }
    }
  ]);

  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        numOrders: { $sum: 1 },
        revenue: { $sum: '$total' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
      dailyRevenue
    }
  });
}); 