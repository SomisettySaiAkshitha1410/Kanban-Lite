# Kanban Lite

A lightweight, full-stack Kanban board application featuring user authentication, team collaboration, board sharing, and real-time task management.  
Deployed with a **React frontend (Vercel)**, **Node.js/Express backend (Render)**, and **MySQL database (Clever Cloud)**.

---

## 🚀 Features
- **User Authentication**: Register and login securely with email and password.  
- **Kanban Boards**: Create, manage, and share boards for different projects.  
- **Lists and Cards**: Add lists to boards and tasks (cards) to lists, supporting descriptions, positions, and assignment.  
- **Board Sharing**: Invite users and manage permissions—owner, editor, or viewer.  
- **Real-Time Updates**: Updates are instantly reflected across users.  
- **Role-Based Access**: Permission management per board (owner, editor, viewer).  
- **Responsive Design**: Works well across desktops and mobile devices.  

---

## 🛠 Tech Stack

| Layer     | Technology                               |
|-----------|-------------------------------------------|
| Frontend  | React, Socket.io, Styled with CSS / React Beautiful DnD |
| Backend   | Node.js, Express, Socket.io                        |
| Database  | MySQL (Clever Cloud)                      |
| Hosting   | Vercel (frontend), Render (backend)       |

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/kanban-lite.git

---
###  2. Install dependencies
```bash
cd kanban-lite/frontend
npm install

cd ../backend
npm install
---
### 3. Set up Environment Variables

**Frontend (`frontend/.env`)**
```env
REACT_APP_API_URL=https://your-backend.onrender.com


#### Backend (`backend/.env`)
```env
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASS=your-mysql-password
DB_NAME=your-mysql-dbname
DB_PORT=3306
JWT_SECRET=your-secret-key
FRONTEND_ORIGIN=https://your-frontend.vercel.app

---
### 4. Run locally

**Backend**

```bash
cd backend
npm start

**Frontend**
```bash
cd frontend
npm start


---

## Deployment

- Frontend is deployed on Vercel: [Live App](https://kanban-lite-kappa.vercel.app)
- Backend is deployed on Render: [API Endpoint](https://kanban-lite.onrender.com)
- Database hosted on Clever Cloud MySQL

---

## Database Schema

Tables:
- `users`
- `boards`
- `lists`
- `cards`
- `user_board_permissions` (roles: owner, editor, viewer)

---

## License

This project is licensed under the MIT License.

---

## Contributing

Feel free to submit issues and pull requests for improvements!

---

## Acknowledgements

- [Render](https://render.com)
- [Vercel](https://vercel.com)
- [Clever Cloud](https://www.clever-cloud.com)
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd)

