# SecureVote - Secure Digital Democracy Portal

SecureVote is a premium, secure, full-stack online voting application built with React, TypeScript, Tailwind CSS, Express, Node.js, and MongoDB. It implements robust modern security protocols, role-based access, Socket.io for live turnout feeds, Chart.js for analytics, and cryptographic vote integrity verification.

## 🌟 Features

* **Landing Page**: Modern premium interface with stats counters, animated timeline steps, FAQs, and testimonials.
* **Authentication**: Email validation, Two-Factor Authentication (MFA), JWT tokens, and secure forgot password recovery.
* **Voter Dashboard**: Explore active elections, view candidate public profiles/manifestos, complete a secure step-by-step voting wizard, and download digital ballot receipts.
* **Candidate Dashboard**: Update symbol, bio, manifesto, and view voting tallies after election closes.
* **Admin Dashboard**: Create/edit/delete elections, manage candidates/voters, approve registrations, upload bulk voter lists via CSV, and download PDF, Excel, or CSV audit reports.
* **Real-Time Turnout**: Socket.io live synchronization pushes turnout stats immediately to charts.
* **Cryptographic Auditing**: Encrypted voting ballots (AES-256-CBC) and public-facing SHA-256 verification hash receipts.
* **Auditing Logs**: Secure, unalterable logger recording IP addresses, actions, timestamps, and roles.

---

## 🛠️ Tech Stack

* **Frontend**: React.js, TypeScript, Vite, Tailwind CSS, Framer Motion, Chart.js / react-chartjs-2, Socket.io-client.
* **Backend**: Node.js, Express.js, TypeScript, Mongoose, Socket.io, JWT (Access & Refresh), PDFKit, ExcelJS, bcryptjs.
* **Database**: MongoDB.
* **Deployment**: Docker, Docker Compose, Nginx.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (running locally, or use Docker)
* [Docker](https://www.docker.com/) (Optional, for containerized run)

---

### Method 1: Local Installation

1. **Install Dependencies**:
   Initialize and install node modules for both the client and server projects:
   ```bash
   npm run install-all
   ```

2. **Configure Environment Variables**:
   * **Backend**: An `.env` file has been generated inside the `backend/` folder with default configurations.
   * **Frontend**: Vite proxies requests to `http://localhost:5000` automatically based on `vite.config.ts`.

3. **Seed Mock Database**:
   Populate the database with sample Elections, Candidates, and default users (Admin, Officer, Voters, Candidates):
   ```bash
   npm run seed-db
   ```

4. **Run Development Servers**:
   Start both dev environments simultaneously:
   * In terminal 1 (start backend API):
     ```bash
     npm run dev-backend
     ```
   * In terminal 2 (start Vite React frontend):
     ```bash
     npm run dev-frontend
     ```
   * Access the client application at: `http://localhost:5173`

---

### Method 2: Docker Compose (Instant Startup)

Run the entire stack (MongoDB + Express Backend + React Client served via Nginx) inside Docker containers:

1. **Build and start containers**:
   ```bash
   docker-compose up -d --build
   ```

2. **Seed the database inside the container**:
   ```bash
   docker exec -it securevote-api npm run seed
   ```

3. **Access application portals**:
   * Frontend Application: `http://localhost:8080`
   * Backend REST API: `http://localhost:5000/api`

---

## 🔑 Default Accounts (Seeded)

Use these credentials to log in to the portal after seeding:

| Role | Voter ID | Password | Email |
| :--- | :--- | :--- | :--- |
| **System Admin** | `SV-ADMIN1` | `adminpassword123` | `admin@securevote.gov` |
| **Election Officer** | `SV-OFFICR` | `officerpassword123` | `officer@securevote.gov` |
| **Candidate 1** | `SV-CANDI1` | `candidatepassword123` | `alice@securevote.gov` |
| **Voter 1** | `SV-VOTER1` | `voterpassword123` | `voter1@securevote.gov` |

---

## 📜 Educational Project Disclaimer

This project is created for **educational and portfolio demonstration purposes only**. It showcases modern coding practices, full-stack architecture, and basic cryptographic primitives. It is not audited, certified, or legally compliant for official state, federal, or government elections. Do not use this codebase in production for real elections.
