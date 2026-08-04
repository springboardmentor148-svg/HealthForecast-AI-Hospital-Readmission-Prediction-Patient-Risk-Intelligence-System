#!/bin/sh
set -e

# Replace API_BASE in index.html template
if [ -n "$API_BASE" ]; then
    echo "Setting API_BASE to: $API_BASE"
    export API_BASE
    envsubst '${API_BASE}' < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html
else
    echo "API_BASE not set, using default: /api"
    API_BASE="/api"
    export API_BASE
    envsubst '${API_BASE}' < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html
fi

# Also create a config.js file for JavaScript to use
echo "// Auto-generated config" > /usr/share/nginx/html/config.js
echo "const API_BASE = '${API_BASE}';" >> /usr/share/nginx/html/config.js
echo "const CONFIG = { API_BASE: API_BASE };" >> /usr/share/nginx/html/config.js
echo "console.log('✅ Config loaded. API_BASE:', API_BASE);" >> /usr/share/nginx/html/config.js

# Execute the main command
exec "$@"