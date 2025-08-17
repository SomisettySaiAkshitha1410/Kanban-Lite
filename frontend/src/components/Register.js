import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register(){
  const [username,setUsername]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(username,email,password);
      nav('/');
    } catch(err) {
      alert(err.response?.data?.error || 'Register failed');
    }
  };

  return (
    <div className="container mt-5" style={{maxWidth:480}}>
      <h3>Register</h3>
      <form onSubmit={submit}>
        <div className="mb-3"><label>Username</label><input required className="form-control" value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div className="mb-3"><label>Email</label><input required className="form-control" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div className="mb-3"><label>Password</label><input required type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button className="btn btn-primary">Register</button>
      </form>
    </div>
  );
}
