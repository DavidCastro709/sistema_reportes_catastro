import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Autenticación requerida' });
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'catastro-api', audience: 'catastro-mobile' });
    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, role: true, isActive: true } });
    if (!user?.isActive) return res.status(401).json({ error: 'Cuenta inactiva o inexistente' });
    req.user = { id: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
