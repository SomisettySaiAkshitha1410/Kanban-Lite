


import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/api';
import { Link, useNavigate } from 'react-router-dom';
import BoardCard from './BoardCard';  // import your BoardCard component correctly

export default function Dashboard(){
  const [boards,setBoards] = useState([]);
  const [name,setName] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('api/boards');
        setBoards(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const create = async () => {
    if(!name) return alert('Name required');
    const { data } = await api.post('api/boards', { name });
    setBoards(prev => [...prev, data]);
    setName('');
    nav(`/board/${data.id}`);
  };

  const deleteBoard = async (boardId) => {
    if (!window.confirm('Delete this board and all its lists & cards?')) return;
    try {
      await api.delete(`api/boards/${boardId}`);
      setBoards(prev => prev.filter(b => b.id !== boardId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete board');
    }
  };

  return (
    <>
      <div className="container">
        <h3>Your Boards</h3>
        <div className="mb-3 d-flex gap-2">
          <input 
            className="form-control" 
            placeholder="New board name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
        <div className="row">
          {boards.map(board => (
            <div className="col-md-4" key={board.id}>
              <BoardCard board={board} onDelete={() => deleteBoard(board.id)} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}





