const bcrypt = require('bcryptjs');

async function test() {
  const password = 'user123';
  const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Password "user123" matches hash:', isValid);
  
  // Generate new hash for verification
  const newHash = await bcrypt.hash('user123', 10);
  console.log('New hash for user123:', newHash);
}

test();
