


import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSocket } from '../hooks/useSocket';
import ShareBoardModal from '../components/ShareBoardModal';
import socket from '../socket';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';


export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);

  const [userRole, setUserRole] = useState('owner'); // default owner so your current flow keeps working
  const [activeUsers, setActiveUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
  if (user?.id && !socket.connected) {
    socket.auth = { userId: user.id };
    socket.connect();
  }
  return () => {
    if (socket.connected) socket.disconnect();
  };
}, [user?.id]);


   useEffect(() => {
    if (!boardId || !user?.id) return;

    // Connect if needed
   //if (!socket.connected) socket.connect();

    // Join board room
    socket.emit('joinBoard', boardId);

    // Listen for presence updates
    socket.on('presenceUpdate', async (userIds) => {
      // Remove self from userIds (optional)
      console.log('Active user IDs:', userIds);
      const otherUserIds = userIds.filter(id => id !== user.id);
      if (otherUserIds.length === 0) {
        setActiveUsers([]);
        return;
      }
      try {
        const { data } = await api.post('/api/users/batch', { ids: otherUserIds });
        setActiveUsers(data);
      } catch (err) {
        console.error('Active users fetch failed', err);
        setActiveUsers([]);
      }
    });

    return () => {
      socket.emit('leaveBoard', boardId);
      socket.off('presenceUpdate');
    };
  }, [boardId, user?.id]);

  // real-time handlers
  useSocket(boardId, {
    cardCreated: (c) =>
      setCardsByList((prev) => ({
        ...prev,
        [c.list_id]: [...(prev[c.list_id] || []), c],
      })),
    cardUpdated: (c) =>
      setCardsByList((prev) => {
        const cp = { ...prev };
        Object.keys(cp).forEach((k) => (cp[k] = cp[k].filter((x) => x.id !== c.id)));
        cp[c.list_id] = [...(cp[c.list_id] || []), c].sort((a, b) => a.position - b.position);
        return cp;
      }),
    cardDeleted: ({ id }) =>
      setCardsByList((prev) => {
        const cp = { ...prev };
        Object.keys(cp).forEach((k) => (cp[k] = cp[k].filter((x) => x.id !== id)));
        return cp;
      }),
    listCreated: (l) => setLists((prev) => [...prev, l]),
  });

  // load board
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`api/boards/${boardId}`);
        setBoard(data.board);
        // prefer top-level role, fall back to board.role, default owner to keep your current UX
        const role =
          (data.role && String(data.role).toLowerCase()) ||
          (data.board && String(data.board.role || '').toLowerCase()) ||
          'owner';
        setUserRole(role);

        setLists(data.lists || []);
        const byList = {};
        (data.lists || []).forEach((l) => (byList[l.id] = []));
        (data.cards || []).forEach((c) => byList[c.list_id].push(c));
        setCardsByList(byList);
      } catch (e) {
        console.error(e);
        // if API doesn't return role for some reason, stay with default 'owner'
      }
    })();
  }, [boardId]);

  const canEdit = userRole === 'owner' || userRole === 'editor';

  // drag & drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (!canEdit) return; // viewers cannot move cards

    const { source, destination, draggableId } = result;
    const srcList = Number(source.droppableId);
    const destList = Number(destination.droppableId);
    const cardId = Number(draggableId);

    // optimistic UI
    setCardsByList((prev) => {
      const cp = { ...prev };
      const sourceListCards = Array.from(cp[srcList]);
      const destListCards = srcList === destList ? sourceListCards : Array.from(cp[destList] || []);

      const [moved] = sourceListCards.splice(source.index, 1);
      destListCards.splice(destination.index, 0, moved);

      cp[srcList] = sourceListCards;
      cp[destList] = destListCards;
      return cp;
    });

    try {
      await api.put(`api/cards/${cardId}`, {
        list_id: destList,
        position: destination.index,
      });
      // server will emit cardUpdated to everyone
    } catch (err) {
      console.error('Update failed', err);
      // Optionally: reload list or revert UI
    }
  };

  const createList = async () => {
    if (!canEdit) return;
    const title = prompt('List title');
    if (!title) return;
    try {
      const { data } = await api.post('api/lists', { board_id: boardId, title });
      // update UI immediately (socket may also push it)
      //setLists((prev) => [...prev, data]);
      //setCardsByList((prev) => ({ ...prev, [data.id]: [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const addCard = async (listId) => {
    if (!canEdit) return;
    const title = prompt('Card title');
    if (!title) return;
    try {
      const { data } = await api.post('api/cards', {
        list_id: listId,
        title,
        description: '',
        position: (cardsByList[listId]?.length || 0),
      });
      
    } catch (err) {
      console.error(err);
    }
  };

  const deleteList = async (listId) => {
    if (!canEdit) return;
    if (!window.confirm('Delete this list and all its cards?')) return;
    try {
      await api.delete(`api/lists/${listId}`);
      setLists((prev) => prev.filter((l) => l.id !== listId));
      setCardsByList((prev) => {
        const cp = { ...prev };
        delete cp[listId];
        return cp;
      });
    } catch (err) {
      console.error(err);
      alert('Failed to delete list');
    }
  };

  const deleteCard = async (cardId, listId) => {
    if (!canEdit) return;
    if (!window.confirm('Delete this card?')) return;
    try {
      await api.delete(`api/cards/${cardId}`);
      setCardsByList((prev) => ({
        ...prev,
        [listId]: (prev[listId] || []).filter((c) => c.id !== cardId),
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to delete card');
    }
  };

  
  return (
  <div className="container">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h4>{board?.name || 'Board'}</h4>
      <div>
        {canEdit && (
          <>
            <button className="btn btn-sm btn-outline-primary me-2" onClick={createList}>
              + Add list
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowShareModal(true)}>
              Share Board
            </button>
          </>
        )}
      </div>
    </div>

    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          overflowX: 'auto',
          paddingBottom: 24,
        }}
      >
        {lists.map((list) => (
          <div
            key={list.id}
            style={{ minWidth: 280, background: '#f7f7f7', padding: 12, borderRadius: 6 }}
          > 
       
           
            <div
              className="  d-flex mb-2"
              style={{ gap: 8 }}
            >
               <strong>{list.title}</strong>
              
              {canEdit && (
                <>
                <div className="d-flex justify-content-between align-items-center">
                                    <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={() => addCard(list.id)}
                  >
                    + Card
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteList(list.id)}
                  >
                    Delete
                  </button>

                </div>

                </>
              )}
              
            </div>
          
           

            <Droppable droppableId={String(list.id)}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 80 }}>
                  {(cardsByList[list.id] || []).map((card, index) => (
                    <Draggable
                      key={String(card.id)}
                      draggableId={String(card.id)}
                      index={index}
                      isDragDisabled={!canEdit}
                    >
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className="card mb-2"
                        >
                          <div className="card-body p-2  ">
                            <div className=" d-flex justify-content-between align-items-center">
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{card.title}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{card.description}</div>
                            
                            {canEdit && (
                              <button
                                className="btn btn-sm btn-outline-danger "
                                onClick={() => deleteCard(card.id, list.id)}
                              >
                                Delete
                              </button>
                            )}
                              
                            </div>
                            
                          </div>
                        </div>
                        
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>

    {showShareModal && <ShareBoardModal boardId={boardId} onClose={() => setShowShareModal(false)} />}
      <div style={{ marginBottom: 12 }}>
        <strong>Active Users:</strong>{' '}
        {activeUsers.length === 0
          ? <span>Just you</span>
          : activeUsers.map(u => (
              <span key={u.id} title={u.username} style={{ display: 'inline-block', marginRight: 8 }}>
                <Avatar username={u.username}  size={28} />
                {u.username}
              </span>
            ))
        }
      </div>
  </div>
);

}

