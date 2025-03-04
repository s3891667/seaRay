# Use official PHP Docker image
FROM php:8.2-apache

# Set working directory
WORKDIR /var/www/html

# Copy all project files into the container
COPY . .

# Expose port 80 (Render will map this to the public port)
EXPOSE 80

# Use Apache to serve your PHP files
CMD ["apache2-foreground"]
