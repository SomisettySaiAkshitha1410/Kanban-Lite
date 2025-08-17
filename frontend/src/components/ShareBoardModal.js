import React, { useState, useEffect } from 'react';
import api from '../api/api';
//import Avatar from '../components/Avatar';  // Adjust path as needed


export default function ShareBoardModal({ boardId, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [userRole, setUserRole] = React.useState(null);
  const [error, setError] = useState('');

   useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`api/boards/${boardId}`);
        setUserRole(data.role || data.board?.role);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [boardId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/boards/${boardId}/members`);
        setMembers(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [boardId]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/users/search', { params: { q: searchTerm } });
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/api/boards/${boardId}/members/${userId}`);
      // Refresh member list
      const { data } = await api.get(`/api/boards/${boardId}/members`);
      setMembers(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };
  const handleShare = async () => {
    if (!selectedUserId || !selectedRole) {
      setError('Select user and role');
      return;
    }
    setSharing(true);
    setError('');
    try {
      await api.post(`/api/boards/${boardId}/share`, {
        userIdToShare: selectedUserId,
        role: selectedRole,
      });
      const { data } = await api.get(`/api/boards/${boardId}/members`);
      setMembers(data);
      setSelectedUserId(null);
      setSelectedRole('viewer');
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to share board');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 6,
          padding: 20,
          maxWidth: 450,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 0 15px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5>Share Board</h5>
          <button 
            onClick={onClose} 
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <label>Search users to invite</label>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by username or email"
          style={{ width: '100%', padding: '6px 8px', margin: '8px 0 12px 0', boxSizing: 'border-box' }}
        />
        {loading && <div>Searching...</div>}
        {!loading && searchResults.length === 0 && searchTerm.length >= 2 && (
          <div>No users found</div>
        )}
        <ul style={{ maxHeight: 150, overflowY: 'auto', paddingLeft: 0, listStyle: 'none' }}>
          {searchResults.map(u => (
            <li
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              style={{
                cursor: 'pointer',
                padding: '4px 8px',
                backgroundColor: selectedUserId === u.id ? '#007bff' : 'transparent',
                color: selectedUserId === u.id ? 'white' : 'black',
              }}
            >
              {u.username} ({u.email})
            </li>
          ))}
        </ul>

        <label>Assign role</label>
        <select 
          value={selectedRole} 
          onChange={e => setSelectedRole(e.target.value)} 
          style={{ width: '100%', padding: '6px 8px', marginBottom: 12 }}
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleShare}
          disabled={sharing}
          style={{ width: '100%', padding: '8px', cursor: 'pointer' }}
        >
          {sharing ? 'Sharing...' : 'Share'}
        </button>

        <hr />

        <h6>Current Members</h6>
        <ul style={{ maxHeight: 150, overflowY: 'auto', paddingLeft: 0, listStyle: 'none' }}>
          {members.map(m => (
            <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              


  


              <span>{m.username} — <i>{m.role}</i></span>
              {/* You can add controls here to remove/change role */}
              {userRole === 'owner' && m.role !== 'owner' && (
                <button
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                  onClick={() => handleRemoveMember(m.id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
