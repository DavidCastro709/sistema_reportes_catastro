import app from './app.js';
import { prisma } from './config/prisma.js';

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.log(`Catastro API listening on port ${port}`));

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
