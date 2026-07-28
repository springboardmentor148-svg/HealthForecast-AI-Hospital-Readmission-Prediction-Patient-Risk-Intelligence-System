import subprocess
import sys

def fix_bcrypt():
    print("🔧 Fixing bcrypt installation...")
    
    # Uninstall
    subprocess.run([sys.executable, "-m", "pip", "uninstall", "bcrypt", "passlib", "-y"])
    
    # Reinstall with specific versions
    subprocess.run([sys.executable, "-m", "pip", "install", "bcrypt==4.0.1"])
    subprocess.run([sys.executable, "-m", "pip", "install", "passlib==1.7.4"])
    
    print("✅ bcrypt fixed!")
    print("Try running: uvicorn app.main:app --reload --port 8000")

if __name__ == "__main__":
    fix_bcrypt()