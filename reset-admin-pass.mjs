import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

const hash = await bcrypt.hash('Admin1234', 10);
const db = createClient({ url: 'file:./data/tzofen.db' });
await db.execute({ sql: 'UPDATE users SET passwordHash = ? WHERE email = ?', args: [hash, 'idan1164@gmail.com'] });
console.log('Password reset to Admin1234! for idan1164@gmail.com');
db.close();
