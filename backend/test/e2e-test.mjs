import http from 'http';

const BASE = 'http://localhost:3001';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Minimal valid 1x1 red PNG as base64
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';

async function test() {
  console.log('1. Creating anonymous user...');
  const user = await request('POST', '/api/anonymous-users', {});
  console.log('   User ID:', user?.data?.userId || '(check response)');
  const userId = user?.data?.userId;
  if (!userId) { console.log('   Response:', JSON.stringify(user).slice(0, 200)); return; }

  console.log('2. Updating profile with photo (portrait generation)...');
  const profileData = {
    displayName: 'Test Investigator',
    bio: 'Testing portrait generation',
    photoData: `data:image/png;base64,${TINY_PNG_BASE64}`,
    generatePortrait: true,
  };

  const start = Date.now();
  const result = await request('PUT', `/api/profiles/${userId}`, profileData);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`   Response after ${elapsed}s:`);
  console.log(`   portraitStatus: ${result.portraitStatus}`);
  console.log(`   hasGeneratedPortrait: ${result.data?.hasGeneratedPortrait}`);
  console.log(`   photo length: ${result.data?.photo?.length || 0} chars`);

  if (result.portraitStatus === 'READY' && result.data?.hasGeneratedPortrait) {
    console.log('\n✓ PORTRAIT GENERATION SUCCESSFUL!');
  } else if (result.portraitStatus === 'GENERATING') {
    console.log('\n△ Portrait still generating (async)');
  } else if (result.portraitStatus === 'UNAVAILABLE') {
    console.log('\n✗ Portrait generation unavailable');
    console.log('   Check server logs for details.');
  } else {
    console.log('\n? Unexpected status:', result.portraitStatus);
  }
}

test().catch(console.error);
