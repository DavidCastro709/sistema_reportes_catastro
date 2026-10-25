import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { recordAudit } from '../services/audit.service.js';

const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const valid = user && user.isActive && await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
  await recordAudit(prisma, { actorId: user.id, action: 'LOGIN_SUCCEEDED', entity: 'User', entityId: user.id, ipAddress: req.ip });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '30m', issuer: 'catastro-api', audience: 'catastro-mobile' });
  return res.json({ token, expiresIn: process.env.JWT_EXPIRES_IN || '30m', user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
}

export async function currentUser(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, fullName: true, role: true } });
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  return res.json({ user });
}
