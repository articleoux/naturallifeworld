const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Multer storage configuration for user profile images
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'phone',
    'address'
  );
  
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

// Admin only routes
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); // Don't update passwords with this!
exports.deleteUser = factory.deleteOne(User);

// Get user profile
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .select('name email phone address photo role active')
    .populate({
      path: 'orders',
      select: 'orderNumber status total createdAt items'
    });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Add address to user profile
exports.addAddress = catchAsync(async (req, res, next) => {
  const {
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault
  } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const newAddress = {
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country
  };

  // If the address is set as default, mark other addresses as not default
  if (isDefault && user.addresses.length > 0) {
    user.addresses = user.addresses.map(addr => {
      addr.isDefault = false;
      return addr;
    });
  }

  // Add isDefault flag to new address
  newAddress.isDefault = isDefault || user.addresses.length === 0;
  
  user.addresses.push(newAddress);
  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update address in user profile
exports.updateAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const {
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault
  } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const addressIndex = user.addresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(new AppError('Address not found', 404));
  }

  // Update address fields
  if (addressLine1) user.addresses[addressIndex].addressLine1 = addressLine1;
  if (addressLine2 !== undefined) user.addresses[addressIndex].addressLine2 = addressLine2;
  if (city) user.addresses[addressIndex].city = city;
  if (state) user.addresses[addressIndex].state = state;
  if (postalCode) user.addresses[addressIndex].postalCode = postalCode;
  if (country) user.addresses[addressIndex].country = country;

  // If the address is set as default, mark other addresses as not default
  if (isDefault) {
    user.addresses = user.addresses.map((addr, idx) => {
      addr.isDefault = idx === addressIndex;
      return addr;
    });
  }

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Delete address from user profile
exports.deleteAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const addressIndex = user.addresses.findIndex(
    addr => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(new AppError('Address not found', 404));
  }

  const isDefault = user.addresses[addressIndex].isDefault;
  
  // Remove the address
  user.addresses.splice(addressIndex, 1);
  
  // If the removed address was default and other addresses exist,
  // set the first address as default
  if (isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save({ validateBeforeSave: true });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get user wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: 'wishlist',
      select: 'name price imageCover slug category shortDescription'
    });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    results: user.wishlist.length,
    data: {
      wishlist: user.wishlist
    }
  });
});

// Add product to wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  
  if (!productId) {
    return next(new AppError('Please provide a product ID', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $addToSet: { wishlist: productId } },
    { new: true }
  ).populate({
    path: 'wishlist',
    select: 'name price imageCover slug category shortDescription'
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      wishlist: updatedUser.wishlist
    }
  });
});

// Remove product from wishlist
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { wishlist: productId } },
    { new: true }
  ).populate({
    path: 'wishlist',
    select: 'name price imageCover slug category shortDescription'
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      wishlist: updatedUser.wishlist
    }
  });
}); 