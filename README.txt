SRI SELVAM METALS - DIGITAL CATALOG

HOW TO RUN (Windows)
1. Install Node.js (the LTS version, free) from https://nodejs.org  (one time only).
2. Unzip this folder.
3. Double-click  start-windows.bat
4. The browser opens the catalog. Keep the black window open.

  Customers page :  http://localhost:3000
  Owner page     :  http://localhost:3000/admin
  First-run owner password: shown once in the server console. Save it and change it after login.

AFTER FIRST LOGIN
- Change the password (bottom of the owner page).
- Add your products with photos. They are saved in the "data" folder.
- BACK UP the "data" folder regularly. It holds all products, photos and the password.
- If you forget the password, use "Forgot password?" and type the reset code
  found in data/config.json (the "code" value).

SHOW ON OTHER PHONES (same Wi-Fi)
Find your computer's IP address (command: ipconfig), then open  http://YOUR-IP:3000  on the phone.

SHARE WITH ALL CUSTOMERS ON THE INTERNET
The computer must stay on, so it is better to host this folder on an online server
(for example Render, Railway or a small VPS). Come back to me and I will guide you step by step.
The server reads the PORT setting automatically.

FILES
server.js          the server (no extra installs needed)
public/index.html  the catalog and owner screens
public/portrait.jpg your grandpa's photo
data/              created on first run: products, photos, settings
