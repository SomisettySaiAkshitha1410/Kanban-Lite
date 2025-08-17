import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocket(boardId, handlers = {}) {
  useEffect(() => {
    if (!boardId) return;
    const socket = io(process.env.REACT_APP_API_URL, { autoConnect: true });
    socket.on('connect', () => socket.emit('joinBoard', boardId));

    // attach handlers if provided
    if (handlers.cardCreated) socket.on('cardCreated', handlers.cardCreated);
    if (handlers.cardUpdated) socket.on('cardUpdated', handlers.cardUpdated);
    if (handlers.cardDeleted) socket.on('cardDeleted', handlers.cardDeleted);
    if (handlers.listCreated) socket.on('listCreated', handlers.listCreated);
    if (handlers.listUpdated) socket.on('listUpdated', handlers.listUpdated);
    if (handlers.listDeleted) socket.on('listDeleted', handlers.listDeleted);

    return () => {
      socket.emit('leaveBoard', boardId);
      socket.disconnect();
    };
  }, [boardId]);
}
