#!/bin/bash
set -e
echo "1. Copying static files to document root..."
mkdir -p /home8/aashutos/basnetaashutosh.com.np/static
cp -r /home8/aashutos/chandani_backend/staticfiles/* /home8/aashutos/basnetaashutosh.com.np/static/ || true

echo "2. Writing .htaccess for Chandani React Admin & API passthrough..."
cat << 'HTACCESS' > /home8/aashutos/basnetaashutosh.com.np/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Direct pass-through for backend /api and /api/admin/
  RewriteRule ^api/ - [L]

  # Direct pass-through for static files
  RewriteRule ^static/ - [L]

  # Existing files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Single Page Application fallback to index.html (supports /admin and all frontend routes)
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS
chmod 644 /home8/aashutos/basnetaashutosh.com.np/.htaccess

echo "3. Restarting backend application..."
mkdir -p /home8/aashutos/chandani_backend/tmp
touch /home8/aashutos/chandani_backend/tmp/restart.txt

echo "Chandani Admin routing and .htaccess updated successfully!"
