
import { io } from 'socket.io-client';

const user = JSON.parse(localStorage.getItem('user')); // Must be a real user object with .id
const socket = io(process.env.REACT_APP_API_URL, {
  autoConnect: false,
  auth: { userId: user?.id }
});

export default socket;
