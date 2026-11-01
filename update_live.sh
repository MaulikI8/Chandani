#!/bin/bash
set -e
echo "Updating Chandani live..."

# 1. Update repo
cd ~/Chandani_live
git fetch origin main
git reset --hard origin/main

# 2. Update backend files
cp -r backend/* ~/chandani_backend/

# 3. Ensure staticfiles directory exists in docroot and backend
mkdir -p ~/chandani_backend/staticfiles
cp -r backend/staticfiles/* ~/chandani_backend/staticfiles/

mkdir -p /home8/aashutos/basnetaashutosh.com.np/api/static
cp -r backend/staticfiles/* /home8/aashutos/basnetaashutosh.com.np/api/static/

mkdir -p /home8/aashutos/basnetaashutosh.com.np/static
cp -r backend/staticfiles/* /home8/aashutos/basnetaashutosh.com.np/static/

# 4. Update .htaccess in docroot to redirect /admin to /api/admin/
cat << 'EOF' > /home8/aashutos/basnetaashutosh.com.np/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect /admin to /api/admin/
  RewriteRule ^admin/?$ /api/admin/ [R=301,L]

  # Pass through backend API & Admin requests
  RewriteRule ^api/ - [L]

  # Existing files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Single Page Application fallback
  RewriteRule ^ index.html [L]
</IfModule>
EOF

chmod 644 /home8/aashutos/basnetaashutosh.com.np/.htaccess

# 5. Collectstatic with virtualenv
source ~/virtualenv/chandani_backend/3.11/bin/activate
python ~/chandani_backend/manage.py collectstatic --noinput

# 6. Restart WSGI App
mkdir -p ~/chandani_backend/tmp
touch ~/chandani_backend/tmp/restart.txt

echo "Chandani live update completed successfully!"
