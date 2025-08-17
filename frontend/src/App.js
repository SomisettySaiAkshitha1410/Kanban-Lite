import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BoardPage from './pages/BoardPage';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
//import { useAuth } from '../context/AuthContext';

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}
function PublicRoute({ children }) {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
 // const {user}=useAuth();
  return (
    <AuthProvider>
      <BrowserRouter>
      <Navbar/>
        <Routes>
          
          
          {/* <Route path="/login" element={<Login/>} />

          <Route path="/register" element={<Register/>} /> */}
          <Route path="/login" element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  } />
  <Route path="/register" element={
    <PublicRoute>
      <Register />
    </PublicRoute>
  } />
          <Route path="/" element={<Protected><Dashboard/></Protected>} />
          <Route path="/board/:boardId" element={<Protected><BoardPage/></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
