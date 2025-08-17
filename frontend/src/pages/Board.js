import React, { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import socket from '../socket';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function BoardPage({ boardId }) {
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({}); // { listId: [cards] }

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await api.get(`/boards/${boardId}`);
      if (!mounted) return;
      setLists(data.lists);
      const byList = {};
      data.lists.forEach(l => byList[l.id] = []);
      data.cards.forEach(c => {
        byList[c.list_id].push(c);
      });
      setCardsByList(byList);
    }
    load();

    socket.connect();
    socket.emit('joinBoard', boardId);

    socket.on('cardCreated', (card) => {
      setCardsByList(prev => ({ ...prev, [card.list_id]: [ ...(prev[card.list_id]||[]), card] }));
    });
    socket.on('cardUpdated', (card) => {
      setCardsByList(prev => {
        const copy = {...prev};
        // remove from all lists
        Object.keys(copy).forEach(k => copy[k] = copy[k].filter(x => x.id !== card.id));
        // add to its list
        copy[card.list_id] = [...(copy[card.list_id]||[]), card].sort((a,b)=>a.position-b.position);
        return copy;
      });
    });
    socket.on('cardDeleted', ({id}) => {
      setCardsByList(prev => {
        const copy = {...prev};
        Object.keys(copy).forEach(k => copy[k] = copy[k].filter(x => x.id !== id));
        return copy;
      });
    });

    return () => {
      socket.emit('leaveBoard', boardId);
      socket.off('cardCreated'); socket.off('cardUpdated'); socket.off('cardDeleted');
      socket.disconnect();
      mounted = false;
    };
  }, [boardId]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    const sourceList = source.droppableId;
    const destList = destination.droppableId;

    // optimistic UI move
    setCardsByList(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const [removed] = copy[sourceList].splice(source.index, 1);
      copy[destList].splice(destination.index, 0, removed);
      return copy;
    });

    // tell server to update card
    try {
      await api.put(`/cards/${draggableId}`, {
        list_id: destList,
        position: destination.index
      });
      // server will emit cardUpdated to everyone
    } catch (err) {
      console.error(err);
      // ideally revert UI on error
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{display:'flex',gap:16}}>
        {lists.map(list => (
          <Droppable droppableId={String(list.id)} key={list.id}>
            {(provided)=>(
              <div ref={provided.innerRef} {...provided.droppableProps} style={{width:270, minHeight:200, background:'#f4f4f4', padding:8}}>
                <h4>{list.title}</h4>
                {(cardsByList[list.id]||[]).map((card, idx)=>(
                  <Draggable draggableId={String(card.id)} index={idx} key={card.id}>
                    {(prov)=>(
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={{padding:8, margin:'8px 0', background:'white', borderRadius:4}}>
                        <strong>{card.title}</strong>
                        <div>{card.description}</div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
export default BoardPage;
