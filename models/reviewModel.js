const mongoose = require('mongoose');
const Product = require('./productModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      trim: true,
      maxlength: [1000, 'Review must be less than 1000 characters']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Review must have a rating']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title must be less than 100 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    },
    verified: {
      type: Boolean,
      default: false
    },
    helpful: {
      count: {
        type: Number,
        default: 0
      },
      users: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'User'
        }
      ]
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    photos: [String],
    rejectionReason: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate reviews from same user on same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  
  next();
});

reviewSchema.statics.calcAverageRatings = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, status: 'approved' }
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.product);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.product);
});

// Approve review
reviewSchema.methods.approve = async function() {
  this.status = 'approved';
  this.updatedAt = Date.now();
  await this.save();
  
  return this;
};

// Reject review
reviewSchema.methods.reject = async function(reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.updatedAt = Date.now();
  await this.save();
  
  return this;
};

// Mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  const userIdStr = userId.toString();
  
  if (!this.helpful.users.some(user => user.toString() === userIdStr)) {
    this.helpful.users.push(userId);
    this.helpful.count = this.helpful.users.length;
    await this.save();
  }
  
  return this;
};

// Unmark review as helpful
reviewSchema.methods.unmarkHelpful = async function(userId) {
  const userIdStr = userId.toString();
  
  if (this.helpful.users.some(user => user.toString() === userIdStr)) {
    this.helpful.users = this.helpful.users.filter(
      user => user.toString() !== userIdStr
    );
    this.helpful.count = this.helpful.users.length;
    await this.save();
  }
  
  return this;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 