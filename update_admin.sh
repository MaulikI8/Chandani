#!/bin/bash
set -e
echo "1. Copying static files to document root..."
mkdir -p /home8/aashutos/basnetaashutosh.com.np/static
cp -r /home8/aashutos/chandani_backend/staticfiles/* /home8/aashutos/basnetaashutosh.com.np/static/

echo "2. Writing .htaccess redirect for /admin..."
cat << 'EOF' > /home8/aashutos/basnetaashutosh.com.np/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect /admin and /admin/* to Django Admin at /api/admin/
  RewriteRule ^admin/?(.*)$ /api/admin/$1 [R=301,L]

  # Direct pass-through for backend /api
  RewriteRule ^api/ - [L]

  # Direct pass-through for static files
  RewriteRule ^static/ - [L]

  # Existing files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Single Page Application fallback to index.html
  RewriteRule ^ index.html [L]
</IfModule>
EOF
chmod 644 /home8/aashutos/basnetaashutosh.com.np/.htaccess

echo "3. Restarting backend application..."
mkdir -p /home8/aashutos/chandani_backend/tmp
touch /home8/aashutos/chandani_backend/tmp/restart.txt

echo "Admin routing and static files updated successfully!"
