const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A testimonial must have a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'A testimonial must have an email'],
      lowercase: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'A testimonial must have a title'],
      trim: true,
      maxlength: [100, 'A testimonial title must have less or equal than 100 characters']
    },
    text: {
      type: String,
      required: [true, 'A testimonial must have text content'],
      trim: true,
      maxlength: [500, 'A testimonial must have less or equal than 500 characters']
    },
    rating: {
      type: Number,
      required: [true, 'A testimonial must have a rating'],
      min: 1,
      max: 5
    },
    photo: {
      type: String,
      default: 'default-avatar.jpg'
    },
    position: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    featured: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number
    },
    productUsed: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
testimonialSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = Date.now();
    } else if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = Date.now();
    }
  }
  this.updatedAt = Date.now();
  next();
});

// QUERY MIDDLEWARE
testimonialSchema.pre(/^find/, function(next) {
  // If not specifically querying for pending testimonials, only show approved ones
  if (!this._conditions.status) {
    this.find({ status: 'approved' });
  }
  
  if (this._conditions.productUsed) {
    this.populate({
      path: 'productUsed',
      select: 'name'
    });
  }
  
  next();
});

// For finding all methods with specific status
testimonialSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// For finding featured testimonials
testimonialSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'approved' }).sort({ order: 1 });
};

// For approving a testimonial
testimonialSchema.methods.approve = function() {
  this.status = 'approved';
  this.approvedAt = Date.now();
  this.updatedAt = Date.now();
  return this.save();
};

// For rejecting a testimonial
testimonialSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectedAt = Date.now();
  this.rejectionReason = reason;
  this.updatedAt = Date.now();
  return this.save();
};

// For setting a testimonial as featured
testimonialSchema.methods.setFeatured = function(isFeatured = true) {
  this.featured = isFeatured;
  this.updatedAt = Date.now();
  return this.save();
};

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial; 