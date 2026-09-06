import { io as ClientSocket } from 'socket.io-client';

async function testProxy() {
  console.log('Testing Socket.IO connection through Vite proxy at http://localhost:5174 ...');

  const socketA = ClientSocket('http://localhost:5174', {
    transports: ['websocket', 'polling'],
  });

  await new Promise<void>((resolve, reject) => {
    socketA.on('connect', () => {
      console.log('✓ Socket A connected successfully through http://localhost:5174 (ID:', socketA.id, ')');
      resolve();
    });
    socketA.on('connect_error', (err) => reject(err));
  });

  // Test Create Game
  const createRes: any = await new Promise((res) => {
    socketA.emit('create_room', { playerName: 'Akshay' }, res);
  });
  if (!createRes.success) throw new Error('Create room failed over proxy');
  console.log('✓ Room created via proxy! Code:', createRes.state.room.code);

  const roomCode = createRes.state.room.code;

  // Test Join Game from Socket B through http://localhost:5174
  const socketB = ClientSocket('http://localhost:5174', {
    transports: ['websocket', 'polling'],
  });

  await new Promise<void>((resolve, reject) => {
    socketB.on('connect', () => {
      console.log('✓ Socket B connected successfully through http://localhost:5174 (ID:', socketB.id, ')');
      resolve();
    });
    socketB.on('connect_error', (err) => reject(err));
  });

  const joinRes: any = await new Promise((res) => {
    socketB.emit('join_room', { roomCode, playerName: 'Rahul' }, res);
  });
  if (!joinRes.success) throw new Error('Join room failed over proxy');
  console.log('✓ Rahul joined room via proxy successfully!');

  socketA.disconnect();
  socketB.disconnect();

  console.log('🎉 Proxy and multiplayer communication through port 5174 verified 100%!');
}

testProxy().catch((err) => {
  console.error('❌ Proxy test failed:', err);
  process.exit(1);
});
