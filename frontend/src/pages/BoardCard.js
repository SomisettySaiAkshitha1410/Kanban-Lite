import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

export default function BoardCard({ board, onDelete }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Fetch members excluding current user if not filtered backend
        const res = await api.get(`/api/boards/${board.id}/members`);
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [board.id]);

  return (
    <div className="card mb-3">
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <h5>{board.name}</h5>
          <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>
            Shared with:{' '}
            {users.length === 0 ? (
              <span>No other users</span>
            ) : (
              users.map((u) => (
                <span key={u.id} style={{ marginRight: 8 }}>
                  {u.username} <i>({u.role})</i>
                </span>
              ))
            )}
          </div>
        </div>
        <div className="mt-3 d-flex align-items-center">
          <Link to={`/board/${board.id}`} className="btn btn-outline-primary btn-sm me-2">Open</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}
