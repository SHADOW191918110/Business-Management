# Create the directory structure for the POS web application
import os

# Create main directories
directories = [
    'pos-app',
    'pos-app/public',
    'pos-app/public/css',
    'pos-app/public/js',
    'pos-app/public/images',
    'pos-app/server',
    'pos-app/server/models',
    'pos-app/server/routes',
    'pos-app/server/middleware'
]

for directory in directories:
    os.makedirs(directory, exist_ok=True)
    print(f"Created directory: {directory}")

print("\nDirectory structure created successfully!")