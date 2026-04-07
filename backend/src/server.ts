import { app } from './app';
import { prisma } from './config/database';
import { env } from './config/env';

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');

    app.listen(env.PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${env.PORT}`);
      console.log(`📦 Ambiente: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar o servidor:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🛑 Servidor encerrado');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
