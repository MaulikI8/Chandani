#!/bin/bash
set -e
echo "Updating Chandani live..."

# 1. Update repo
cd ~/Chandani_live
git fetch origin main
git reset --hard origin/main

# 2. Deploy React Frontend with Admin Suite (using prebuilt dist)
echo "Deploying React frontend..."
cd ~/Chandani_live/react-app
if [ -d "dist" ]; then
  echo "Copying prebuilt dist to docroot..."
  cp -rf dist/* /home8/aashutos/basnetaashutosh.com.np/
else
  echo "dist not found, attempting build..."
  export PATH="/opt/alt/alt-nodejs20/root/usr/bin:$PATH"
  npm run build || npx vite build || true
  cp -rf dist/* /home8/aashutos/basnetaashutosh.com.np/
fi

# 3. Update backend files
cd ~/Chandani_live
cp -r backend/* ~/chandani_backend/

# 4. Ensure staticfiles directory exists in docroot and backend
mkdir -p ~/chandani_backend/staticfiles
cp -r backend/staticfiles/* ~/chandani_backend/staticfiles/ || true

mkdir -p /home8/aashutos/basnetaashutosh.com.np/api/static
cp -r backend/staticfiles/* /home8/aashutos/basnetaashutosh.com.np/api/static/ || true

mkdir -p /home8/aashutos/basnetaashutosh.com.np/static
cp -r backend/staticfiles/* /home8/aashutos/basnetaashutosh.com.np/static/ || true

# 5. Update .htaccess in docroot to route /admin to React SPA
cat << 'HTACCESS' > /home8/aashutos/basnetaashutosh.com.np/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Pass through backend API & Django Admin
  RewriteRule ^api/ - [L]

  # Pass through static and media
  RewriteRule ^static/ - [L]
  RewriteRule ^media/ - [L]

  # Existing files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Single Page Application fallback (loads index.html for /admin and storefront)
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS
chmod 644 /home8/aashutos/basnetaashutosh.com.np/.htaccess

# 6. Collectstatic with virtualenv
if [ -f ~/virtualenv/chandani_backend/3.11/bin/activate ]; then
  source ~/virtualenv/chandani_backend/3.11/bin/activate
  python ~/chandani_backend/manage.py collectstatic --noinput || true
fi

# 7. Restart WSGI App
mkdir -p ~/chandani_backend/tmp
touch ~/chandani_backend/tmp/restart.txt

echo "Chandani live update completed successfully!"
