const Review = require('../models/reviewModel');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// Middleware to set product and user IDs for nested routes
exports.setProductUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Middleware to check if user purchased the product
exports.checkPurchased = catchAsync(async (req, res, next) => {
  // Skip for admin and manager roles
  if (req.user.role === 'admin' || req.user.role === 'manager') return next();

  const productId = req.params.productId || req.body.product;
  
  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }

  // Check if user has purchased the product
  const hasPurchased = await req.user.hasPurchasedProduct(productId);
  
  if (!hasPurchased) {
    return next(
      new AppError('You can only review products you have purchased', 403)
    );
  }

  next();
});

// Create a new review
exports.createReview = catchAsync(async (req, res, next) => {
  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user.id,
    product: req.body.product
  });

  if (existingReview) {
    return next(
      new AppError('You have already reviewed this product', 400)
    );
  }

  // Create the review
  const newReview = await Review.create({
    rating: req.body.rating,
    review: req.body.review,
    user: req.user.id,
    product: req.body.product,
    title: req.body.title
  });

  // Populate user info
  await newReview.populate({
    path: 'user',
    select: 'name photo'
  });

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});

// Get all reviews (with filtering)
exports.getAllReviews = factory.getAll(Review);

// Get single review
exports.getReview = factory.getOne(Review);

// Update review (only by the author or admin)
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  // Check if the user is the author of the review or an admin
  if (
    review.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError('You can only update your own reviews', 403)
    );
  }

  // Update the review
  review.rating = req.body.rating || review.rating;
  review.review = req.body.review || review.review;
  review.title = req.body.title || review.title;

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

// Delete review (only by the author or admin)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  // Check if the user is the author of the review or an admin
  if (
    review.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError('You can only delete your own reviews', 403)
    );
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get reviews for a specific product
exports.getProductReviews = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  
  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }
  
  // Verify product exists
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Get reviews
  const reviews = await Review.find({ product: productId })
    .populate({
      path: 'user',
      select: 'name photo'
    });
  
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

// Get review statistics for a product
exports.getProductReviewStats = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  
  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }
  
  // Verify product exists
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Get review statistics
  const stats = await Review.aggregate([
    {
      $match: { product: product._id }
    },
    {
      $group: {
        _id: null,
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        ratings: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  // Calculate rating distribution
  let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  if (stats.length > 0) {
    stats[0].ratings.forEach(rating => {
      ratingDistribution[rating] += 1;
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats.length > 0 ? stats[0] : null,
      ratingDistribution
    }
  });
});

// Mark review as helpful
exports.markReviewHelpful = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const review = await Review.findById(id);
  
  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }
  
  // Check if user already marked this review
  const userIndex = review.helpfulVotes.users.indexOf(req.user.id);
  
  if (userIndex !== -1) {
    // User already marked, remove the mark
    review.helpfulVotes.users.splice(userIndex, 1);
    review.helpfulVotes.count -= 1;
  } else {
    // User hasn't marked, add the mark
    review.helpfulVotes.users.push(req.user.id);
    review.helpfulVotes.count += 1;
  }
  
  await review.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      helpfulCount: review.helpfulVotes.count,
      marked: userIndex === -1 // true if marked now, false if unmarked
    }
  });
});

// Get top reviews for the homepage
exports.getTopReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ rating: { $gte: 4 } })
    .sort('-helpfulVotes.count -createdAt')
    .limit(6)
    .populate({
      path: 'user',
      select: 'name photo'
    })
    .populate({
      path: 'product',
      select: 'name slug'
    });
    
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
}); 