# System Info App

## Overview
The System Info App is a web application designed to manage and display system information, including the system name, email, phone, address, and logo. This application allows users to upload their own data, which will be displayed prominently in the print and statement sections of the application.

## Features
- User-friendly interface for entering system information.
- Logo upload functionality.
- Display of system information above print and statement sections.
- Ledger and record management.

## Project Structure
```
system-info-app
├── server
│   ├── src
│   │   ├── app.ts
│   │   ├── controllers
│   │   │   └── systemController.ts
│   │   ├── models
│   │   │   └── System.ts
│   │   ├── migrations
│   │   │   └── 0001_create_system_table.sql
│   │   ├── routes
│   │   │   └── systemRoutes.ts
│   │   ├── services
│   │   │   └── storageService.ts
│   │   └── types
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── client
│   ├── src
│   │   ├── pages
│   │   │   └── SystemSetup.tsx
│   │   ├── components
│   │   │   ├── LogoUpload.tsx
│   │   │   └── SystemHeader.tsx
│   │   └── types
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the server directory and install dependencies:
   ```
   cd server
   npm install
   ```
3. Navigate to the client directory and install dependencies:
   ```
   cd ../client
   npm install
   ```

## Usage
1. Start the server:
   ```
   cd server
   npm start
   ```
2. Start the client:
   ```
   cd ../client
   npm start
   ```
3. Open your browser and navigate to `http://localhost:3000` to access the application.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.