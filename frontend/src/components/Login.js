import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const { login } = useAuth();
  const nav = useNavigate();

   useEffect(() => {
    if (login?.id) {
      nav('/boards'); // or your default route
    }
  }, [login, nav]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email,password);
      nav('/');
    } catch(err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container mt-5" style={{maxWidth:480}}>
      <h3>Login</h3>
      <form onSubmit={submit}>
        <div className="mb-3"><label>Email</label><input required className="form-control" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div className="mb-3"><label>Password</label><input required type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button className="btn btn-primary">Login</button>
      </form>
    </div>
  );
}
