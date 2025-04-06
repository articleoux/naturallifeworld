# Natural Life World Admin Panel

This is the administration panel for the Natural Life World website, providing a user-friendly interface to manage products, blog posts, testimonials, orders, and SEO settings.

## Features

- **Dashboard Overview**: View key metrics and recent activity
- **Product Management**: Add, edit, delete products and manage inventory
- **Blog Management**: Create and edit SEO-optimized blog posts
- **Testimonial Management**: Approve, edit, or delete customer testimonials
- **Order Management**: Track and manage customer orders
- **SEO Tools**: Track and optimize website performance

## Setup Instructions

### 1. Authentication Setup

The admin panel is protected with Basic Authentication. To set up:

1. Edit the `.htaccess` file and update the path to your `.htpasswd` file:
   ```
   AuthUserFile /path/to/.htpasswd
   ```

2. The default login credentials are:
   - Username: `admin`
   - Password: `admin123`

3. For security, you should change the password using an htpasswd generator tool.

### 2. File Permissions

Set appropriate file permissions:

```bash
chmod 644 .htaccess
chmod 644 .htpasswd
```

### 3. HTTPS Setup

The admin panel requires HTTPS for security. If you don't have SSL set up:

1. Get an SSL certificate (Let's Encrypt offers free certificates)
2. Install the certificate on your web server
3. Update your domain settings to point to HTTPS

### 4. Custom Error Pages

Create the following error pages in the `/admin/error/` directory:
- 401.html (Unauthorized)
- 403.html (Forbidden)
- 404.html (Not Found)
- 500.html (Server Error)

## Usage Guide

### Product Management

1. **Add New Product**:
   - Click "Add New Product" button
   - Fill in product details
   - Upload images
   - Set inventory levels
   - Configure SEO settings
   - Click "Save"

2. **Edit Product**:
   - Click "Edit" on any product in the product list
   - Make changes
   - Click "Save Changes"

3. **Delete Product**:
   - Click "Delete" on any product (requires confirmation)
   - Or use bulk actions to delete multiple products

### Blog Management

1. **Add New Post**:
   - Click "Add New Post" button
   - Enter title, content, and select category
   - Upload featured image
   - Configure SEO settings (meta title, description, slug)
   - Select "Publish" or "Save as Draft"

2. **Optimize for SEO**:
   - Use the SEO score indicator to improve post optimization
   - Follow the SEO tips provided at the bottom of the blog page
   - Ensure meta title and description are properly configured

### Security Recommendations

1. Change the default admin username and password
2. Regularly update your password
3. Only access the admin panel from trusted networks
4. Regularly back up your website data
5. Keep all scripts and libraries up to date

## Technical Support

If you encounter any issues or need assistance:
- Email: support@naturallifeworld.com
- Phone: (555) 123-4567

## License

This admin panel is proprietary and is licensed exclusively for use by Natural Life World. 