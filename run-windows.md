# Running on Windows

Since you're in WSL2, here are the steps to run this on Windows:

## Option 1: Copy to Windows and run there
1. Copy the entire project to your Windows file system:
   ```bash
   cp -r /home/carlos/reading_agent /mnt/c/Users/YourUsername/Desktop/reading_agent
   ```

2. Open PowerShell/Command Prompt in Windows and navigate to the folder:
   ```cmd
   cd C:\Users\YourUsername\Desktop\reading_agent
   npm install
   npm run build
   npm start
   ```

## Option 2: Use WSL2 with X11 forwarding
1. Install VcXsrv or similar X server on Windows
2. Set DISPLAY environment variable in WSL2:
   ```bash
   export DISPLAY=:0
   ```
3. Install missing libraries (requires sudo):
   ```bash
   sudo apt update
   sudo apt install -y libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
   ```

## Option 3: Test the web interface
The React frontend is already running at http://localhost:5173 - you can view this in your browser to see the UI, though the backend Electron APIs won't work.