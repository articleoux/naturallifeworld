const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A blog post must have a title'],
      trim: true,
      maxlength: [100, 'A blog title must have less or equal than 100 characters']
    },
    slug: String,
    category: {
      type: String,
      required: [true, 'A blog post must have a category'],
      enum: {
        values: ['wellness', 'recipes', 'education', 'lifestyle', 'news'],
        message: 'Category is either: wellness, recipes, education, lifestyle, or news'
      }
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A blog post must have an author']
    },
    content: {
      type: String,
      required: [true, 'A blog post must have content']
    },
    excerpt: {
      type: String,
      trim: true,
      required: [true, 'A blog post must have an excerpt'],
      maxlength: [300, 'An excerpt must have less or equal than 300 characters']
    },
    featuredImage: {
      type: String,
      required: [true, 'A blog post must have a featured image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    publishedAt: Date,
    updatedAt: Date,
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft'
    },
    featured: {
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
    tags: [String],
    seoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    relatedProducts: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
blogSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Set published date when post is published
blogSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  if (this.isModified('content') || this.isModified('title') || this.isModified('metadata')) {
    this.updatedAt = Date.now();
  }
  
  next();
});

// QUERY MIDDLEWARE
blogSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'name photo'
  });
  
  next();
});

// Calculate SEO score based on content
blogSchema.methods.calculateSeoScore = function() {
  let score = 0;
  const maxScore = 100;
  
  // Check if title exists and has good length (50-60 chars)
  if (this.title) {
    score += 10;
    if (this.title.length >= 50 && this.title.length <= 60) {
      score += 5;
    }
  }
  
  // Check meta description
  if (this.metadata.metaDescription) {
    score += 10;
    if (this.metadata.metaDescription.length >= 150 && this.metadata.metaDescription.length <= 160) {
      score += 5;
    }
  }
  
  // Check content length (1500+ words is good for SEO)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    score += 10;
    if (wordCount >= 1500) {
      score += 20;
    } else if (wordCount >= 1000) {
      score += 15;
    } else if (wordCount >= 500) {
      score += 10;
    }
  }
  
  // Check if has featured image
  if (this.featuredImage) {
    score += 10;
  }
  
  // Check if has tags
  if (this.tags && this.tags.length > 0) {
    score += 5;
    if (this.tags.length >= 5) {
      score += 5;
    }
  }
  
  // Check if slug is set
  if (this.slug) {
    score += 10;
  }
  
  this.seoScore = Math.min(score, maxScore);
  return this.seoScore;
};

blogSchema.pre('save', function(next) {
  this.calculateSeoScore();
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog; 