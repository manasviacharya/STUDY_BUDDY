# 📚 Study Buddy  
### A Microservice-Based Flashcard Learning Platform

![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey)
![React](https://img.shields.io/badge/React-Frontend-blue)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)
![REST](https://img.shields.io/badge/API-RESTful-brightgreen)
![License](https://img.shields.io/badge/License-MIT-success)

---

## 🧠 Overview

**Study Buddy** is a microservice-based web application designed to help users learn effectively using digital flashcards.  
Users can create decks and cards, manage learning content, and collaborate by sharing decks with others using read-only or collaborative permissions.

The project strictly follows a **clean microservice architecture**, with each service independently runnable and communicating through REST APIs.

---

## ✨ Features

- 🔐 Secure user authentication using session-based cookies
- 📦 Deck and card management (CRUD)
- 🤝 Deck sharing with read-only or collaborator permissions
- 🌍 Public deck discovery
- 🧩 Fully decoupled backend services
- ⚡ React single-page application frontend
- 🧪 Complete Postman API collection for testing

---

## 🏗️ System Architecture

### Microservices

| Service | Port | Description |
|-------|------|------------|
| User Service | 3001 | Authentication, registration, profile management |
| Deck Service | 3002 | Deck and card CRUD operations |
| Sharing Service | 3004 | Deck sharing and access control |
| Frontend | 3000 | React single-page application |

🔐 **Authentication Model**
- Only the **User Service** manages sessions and cookies.
- Other services authenticate requests by verifying cookies via the User Service.

---

## 🧰 Technology Stack (Strictly Followed)

### Frontend
- HTML5, CSS3
- JavaScript (ES6)
- React.js
- Bootstrap
- jQuery (light DOM interactions only)

### Backend
- Node.js
- Express.js
- REST APIs
- Express Session (User Service only)

### Database
- MySQL

### API Testing
- Postman

> ❗ No additional frameworks, databases, message queues, or third-party auth providers are used.

---

## 🗂️ Project Structure
```text
Study_Buddy/
├── frontend/
│ ├── src/
│ │ ├── api.js
│ │ ├── App.js
│ │ ├── index.js
│ │ └── components/
│ └── package.json
│
├── services/
│ ├── user-service/
│ ├── deck-service/
│ ├── sharing-service/
│
├── database/
│ ├── schema.sql
│ └── seed.sql
│
├── postman/
│ └── Study_Buddy_API.postman_collection.json
│
└── README.md
```
---

## 🗄️ Database Design

Core tables include:
- `users`
- `decks`
- `cards`
- `deck_shares`

All tables use proper foreign keys, indexing, and normalized schema design.

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

- Node.js v18+ (tested with v22)
- MySQL running locally
- npm installed

---

### 2️⃣ Database Setup

```sql
CREATE DATABASE Study_Buddy;
```

```bash
mysql -u root -p Study_Buddy < database/schema.sql
mysql -u root -p Study_Buddy < database/seed.sql
```

## 3️⃣ Environment Variables
Create a .env file inside each service folder.

Example (deck-service/.env):

```env
PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=Study_Buddy
USER_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

⚠️ Ensure DB_NAME and FRONTEND_URL are identical across all services.

## 4️⃣ Install Dependencies

```bash
cd services/user-service && npm install

cd ../deck-service && npm install

cd ../sharing-service && npm install

cd ../../frontend && npm install
```

## 5️⃣ Run the Application (Order Matters)

Terminal 1 – User Service
```bash
cd services/user-service
node server.js
```

Terminal 2 – Deck Service
```bash
cd services/deck-service
node server.js
```

Terminal 3 – Sharing Service
```bash
cd services/sharing-service
node server.js
```

Terminal 4 – Frontend
```bash
cd frontend
npm start
```

## 6️⃣ Health Check
Open in browser:

http://localhost:3001/health
http://localhost:3002/health
http://localhost:3004/health

Expected response:

```json
{ "status": "ok" }
```

## 🔐 Security Highlights
HTTP-only session cookies

sameSite=lax cookie policy

Centralized authentication via User Service

Permission-based access control for shared decks

## 📈 Design Principles
Separation of concerns using microservices

Stateless services except authentication source

RESTful API design with consistent response formats

Frontend kept lightweight and maintainable

## 🔮 Future Enhancements
Collections and favorites

Advanced search and analytics

Learning progress visualization

Docker-based deployment

Role-based access control

## 👤 Author
Manasvi Acharya

## 📄 License
This project is licensed under the MIT License.
