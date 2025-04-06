const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true,
      maxlength: [100, 'A product name must have less or equal than 100 characters']
    },
    slug: String,
    sku: {
      type: String,
      required: [true, 'A product must have a SKU'],
      unique: true
    },
    category: {
      type: String,
      required: [true, 'A product must have a category'],
      enum: {
        values: ['tinctures', 'teas', 'supplements', 'oils', 'topicals', 'bundles'],
        message: 'Category is either: tinctures, teas, supplements, oils, topicals, or bundles'
      }
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A product must have a description']
    },
    shortDescription: {
      type: String,
      trim: true,
      required: [true, 'A product must have a short description'],
      maxlength: [200, 'A short description must have less or equal than 200 characters']
    },
    ingredients: {
      type: String,
      trim: true
    },
    usage: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A product must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    stock: {
      type: Number,
      required: [true, 'A product must have stock information'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      enum: ['in-stock', 'out-of-stock', 'backorder'],
      default: 'out-of-stock'
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    allowBackorders: {
      type: Boolean,
      default: false
    },
    featured: {
      type: Boolean,
      default: false
    },
    new: {
      type: Boolean,
      default: false
    },
    bestseller: {
      type: Boolean,
      default: false
    },
    metadata: {
      metaTitle: {
        type: String,
        trim: true
      },
      metaDescription: {
        type: String,
        trim: true
      },
      metaKeywords: {
        type: String,
        trim: true
      }
    },
    ratings: {
      type: Number,
      default: 0
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    indexProduct: {
      type: Boolean,
      default: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual populate
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Update product status based on stock
productSchema.pre('save', function(next) {
  if (this.trackInventory) {
    if (this.stock <= 0) {
      this.status = this.allowBackorders ? 'backorder' : 'out-of-stock';
    } else if (this.stock > 0) {
      this.status = 'in-stock';
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 