import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';

const [email, fullName, password] = process.argv.slice(2);
if (!email || !fullName || !password || password.length < 12) {
  console.error('Uso: npm run admin:bootstrap -- correo nombre-completo contraseña-de-al-menos-12-caracteres');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email: email.toLowerCase(), fullName, passwordHash, role: 'ADMIN' }, select: { id: true, email: true, role: true } });
    console.log(`Administrador creado: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}
