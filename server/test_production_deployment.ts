import { io as ClientSocket } from 'socket.io-client';

const PROD_URL = 'http://localhost:8080';

async function testProductionDeployment() {
  console.log('\n========================================================');
  console.log('🧪 TESTING SINGLE NODE.JS PRODUCTION SERVER (PORT 8080)');
  console.log('========================================================\n');

  // 1. Test Health endpoint
  const healthRes = await fetch(`${PROD_URL}/api/health`);
  const healthJson = await healthRes.json();
  if (healthJson.status !== 'ok') throw new Error('Health check failed');
  console.log('✓ Health check endpoint working: /api/health -> status: ok');

  // 2. Test SPA index.html serving
  const rootRes = await fetch(`${PROD_URL}/`);
  const rootHtml = await rootRes.text();
  if (!rootHtml.includes('Bingo Live')) throw new Error('Root HTML does not contain Bingo Live title');
  console.log('✓ Root route / serves production compiled index.html');

  // 3. Test SPA route fallback (e.g. invite link /?room=TEST12)
  const roomRouteRes = await fetch(`${PROD_URL}/?room=TEST12`);
  const roomHtml = await roomRouteRes.text();
  if (!roomHtml.includes('Bingo Live')) throw new Error('SPA route fallback failed');
  console.log('✓ SPA route fallback (/?room=TEST12) serves index.html');

  // 4. Test Socket.IO connection directly on production port
  console.log('\n--- Testing Socket.IO on Production Web Service ---');
  const socketA = ClientSocket(PROD_URL, { transports: ['websocket', 'polling'] });
  await new Promise<void>((resolve, reject) => {
    socketA.on('connect', () => {
      console.log('✓ Socket A (Host) connected to production port (ID:', socketA.id, ')');
      resolve();
    });
    socketA.on('connect_error', (err) => reject(err));
  });

  // Create Room
  const createRes: any = await new Promise((res) => {
    socketA.emit('create_room', { playerName: 'Akshay' }, res);
  });
  if (!createRes.success) throw new Error('Create room failed on production server');
  const roomCode = createRes.state.room.code;
  console.log(`✓ Room created successfully! Code: ${roomCode}`);

  // Socket B joins room
  const socketB = ClientSocket(PROD_URL, { transports: ['websocket', 'polling'] });
  await new Promise<void>((resolve, reject) => {
    socketB.on('connect', () => {
      console.log('✓ Socket B (Player 2) connected to production port (ID:', socketB.id, ')');
      resolve();
    });
    socketB.on('connect_error', (err) => reject(err));
  });

  const joinRes: any = await new Promise((res) => {
    socketB.emit('join_room', { roomCode, playerName: 'Rahul' }, res);
  });
  if (!joinRes.success) throw new Error('Join room failed on production server');
  console.log(`✓ Player 2 (Rahul) joined room ${roomCode} successfully!`);

  socketA.disconnect();
  socketB.disconnect();

  console.log('\n========================================================');
  console.log('🎉 PRODUCTION DEPLOYMENT VALIDATION PASSED 100%!');
  console.log('========================================================\n');
}

testProductionDeployment().catch((err) => {
  console.error('❌ Production deployment test failed:', err);
  process.exit(1);
});
