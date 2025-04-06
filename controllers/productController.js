const multer = require('multer');
const sharp = require('sharp');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// Multer storage configuration for product images
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// Multiple image uploads: cover image + product images
exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

// Resize and process uploaded images
exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  // 1) Cover image
  if (req.files.imageCover) {
    req.body.imageCover = `product-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/products/${req.body.imageCover}`);
  }

  // 2) Images
  if (req.files.images) {
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `product-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/products/${filename}`);

        req.body.images.push(filename);
      })
    );
  }

  next();
});

// Get all products with filtering, sorting, and pagination
exports.getAllProducts = factory.getAll(Product);

// Get single product by ID with reviews
exports.getProduct = factory.getOne(Product, { path: 'reviews' });

// Create a new product
exports.createProduct = factory.createOne(Product);

// Update a product
exports.updateProduct = factory.updateOne(Product);

// Delete a product
exports.deleteProduct = factory.deleteOne(Product);

// Get top 5 most popular products by ratings
exports.getTopProducts = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,shortDescription,imageCover,category';
  next();
};

// Get new products (products marked as "new")
exports.getNewProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ new: true })
    .limit(8)
    .select('name price shortDescription imageCover category slug');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

// Get featured products
exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ featured: true })
    .limit(4)
    .select('name price shortDescription imageCover category slug');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

// Get bestsellers
exports.getBestsellers = catchAsync(async (req, res, next) => {
  const products = await Product.find({ bestseller: true })
    .limit(8)
    .select('name price shortDescription imageCover category slug');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

// Get product statistics
exports.getProductStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$category',
        numProducts: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

// Get products by category
exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  
  const products = await Product.find({ category })
    .select('name price shortDescription imageCover category slug stock status');
    
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

// Search products
exports.searchProducts = catchAsync(async (req, res, next) => {
  const searchTerm = req.query.q;
  
  if (!searchTerm) {
    return next(new AppError('Please provide a search term', 400));
  }
  
  const products = await Product.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { shortDescription: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  }).select('name price shortDescription imageCover category slug');
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

// Update product stock and status
exports.updateProductStock = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { stock } = req.body;
  
  const product = await Product.findById(id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  product.stock = stock;
  // Status will be updated automatically through middleware
  
  await product.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
}); 