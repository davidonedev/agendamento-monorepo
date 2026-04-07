import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── Super Admin ────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@agendepro.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'super@agendepro.com',
      passwordHash: await bcrypt.hash('super123', 10),
      role: 'super_admin',
    },
  });
  console.log('✅ Super Admin criado:', superAdmin.email);

  // ─── Tenant 1: Barber Kings ─────────────────────────────────────────────────
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'barber-kings' },
    update: {},
    create: {
      slug: 'barber-kings',
      name: 'Barber Kings',
      ownerName: 'Ricardo Silva',
      email: 'admin@barber-kings.com',
      phone: '(11) 99999-1111',
      address: 'Rua das Flores, 123 - São Paulo, SP',
      status: 'active',
      plan: 'pro',
      monthlyPrice: 197,
      primaryColor: '#1A1A2E',
      adminColor: '#E94560',
      isOpen: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@barber-kings.com' },
    update: {},
    create: {
      name: 'Ricardo Silva',
      email: 'admin@barber-kings.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'tenant_admin',
      tenantId: tenant1.id,
    },
  });

  // Serviços do Tenant 1
  const [s1t1, s2t1, s3t1, s4t1, s5t1] = await Promise.all([
    prisma.service.upsert({
      where: { id: 's1t1-barber-kings' },
      update: {},
      create: {
        id: 's1t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Corte de Cabelo',
        description: 'Corte masculino moderno',
        price: 45,
        duration: 30,
        category: 'Cabelo',
      },
    }),
    prisma.service.upsert({
      where: { id: 's2t1-barber-kings' },
      update: {},
      create: {
        id: 's2t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Barba',
        description: 'Aparar e modelar barba',
        price: 35,
        duration: 30,
        category: 'Barba',
      },
    }),
    prisma.service.upsert({
      where: { id: 's3t1-barber-kings' },
      update: {},
      create: {
        id: 's3t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Corte + Barba',
        description: 'Pacote completo',
        price: 70,
        duration: 60,
        category: 'Combo',
      },
    }),
    prisma.service.upsert({
      where: { id: 's4t1-barber-kings' },
      update: {},
      create: {
        id: 's4t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Coloração',
        description: 'Coloração masculina',
        price: 80,
        duration: 90,
        category: 'Coloração',
      },
    }),
    prisma.service.upsert({
      where: { id: 's5t1-barber-kings' },
      update: {},
      create: {
        id: 's5t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Hidratação',
        description: 'Tratamento capilar',
        price: 55,
        duration: 45,
        category: 'Tratamento',
      },
    }),
  ]);

  // Profissionais do Tenant 1
  const [p1t1, p2t1, p3t1] = await Promise.all([
    prisma.professional.upsert({
      where: { id: 'p1t1-barber-kings' },
      update: {},
      create: {
        id: 'p1t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Carlos Mendes',
        specialty: 'Especialista em Cortes Clássicos',
        bio: 'Barbeiro com 10 anos de experiência, especializado em cortes clássicos e modernos.',
        workingHoursStart: '08:00',
        workingHoursEnd: '18:00',
        workingDays: [1, 2, 3, 4, 5, 6],
      },
    }),
    prisma.professional.upsert({
      where: { id: 'p2t1-barber-kings' },
      update: {},
      create: {
        id: 'p2t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Ana Paula',
        specialty: 'Especialista em Coloração',
        bio: 'Cabeleireira e colorista com foco em técnicas modernas.',
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        workingDays: [1, 2, 3, 4, 5],
      },
    }),
    prisma.professional.upsert({
      where: { id: 'p3t1-barber-kings' },
      update: {},
      create: {
        id: 'p3t1-barber-kings',
        tenantId: tenant1.id,
        name: 'Marcos Oliveira',
        specialty: 'Barbeiro e Especialista em Barba',
        bio: 'Expert em barba e cuidados faciais.',
        workingHoursStart: '10:00',
        workingHoursEnd: '20:00',
        workingDays: [1, 2, 3, 4, 5, 6],
      },
    }),
  ]);

  // Associar serviços aos profissionais
  await prisma.professionalService.createMany({
    data: [
      { professionalId: p1t1.id, serviceId: s1t1.id },
      { professionalId: p1t1.id, serviceId: s2t1.id },
      { professionalId: p1t1.id, serviceId: s3t1.id },
      { professionalId: p2t1.id, serviceId: s1t1.id },
      { professionalId: p2t1.id, serviceId: s4t1.id },
      { professionalId: p2t1.id, serviceId: s5t1.id },
      { professionalId: p3t1.id, serviceId: s2t1.id },
      { professionalId: p3t1.id, serviceId: s3t1.id },
    ],
    skipDuplicates: true,
  });

  // Criar usuários para os profissionais do Tenant 1
  await Promise.all([
    prisma.user.upsert({
      where: { email: 'carlos@barber-kings.com' },
      update: {},
      create: {
        name: 'Carlos Mendes',
        email: 'carlos@barber-kings.com',
        passwordHash: await bcrypt.hash('prof123', 10),
        role: 'professional',
        tenantId: tenant1.id,
        professionalId: p1t1.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'ana@barber-kings.com' },
      update: {},
      create: {
        name: 'Ana Paula',
        email: 'ana@barber-kings.com',
        passwordHash: await bcrypt.hash('prof123', 10),
        role: 'professional',
        tenantId: tenant1.id,
        professionalId: p2t1.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'marcos@barber-kings.com' },
      update: {},
      create: {
        name: 'Marcos Oliveira',
        email: 'marcos@barber-kings.com',
        passwordHash: await bcrypt.hash('prof123', 10),
        role: 'professional',
        tenantId: tenant1.id,
        professionalId: p3t1.id,
      },
    }),
  ]);

  // Clientes do Tenant 1
  const clients1 = await Promise.all([
    prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant1.id, email: 'joao@email.com' } },
      update: {},
      create: { tenantId: tenant1.id, name: 'João Santos', email: 'joao@email.com', phone: '(11) 98765-4321' },
    }),
    prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant1.id, email: 'pedro@email.com' } },
      update: {},
      create: { tenantId: tenant1.id, name: 'Pedro Costa', email: 'pedro@email.com', phone: '(11) 91234-5678' },
    }),
    prisma.client.upsert({
      where: { tenantId_email: { tenantId: tenant1.id, email: 'lucas@email.com' } },
      update: {},
      create: { tenantId: tenant1.id, name: 'Lucas Ferreira', email: 'lucas@email.com', phone: '(11) 94567-8901' },
    }),
  ]);

  // Agendamentos de hoje
  const today = new Date().toISOString().split('T')[0];
  await prisma.appointment.createMany({
    data: [
      {
        tenantId: tenant1.id,
        clientId: clients1[0].id,
        professionalId: p1t1.id,
        serviceId: s1t1.id,
        date: today,
        startTime: '09:00',
        endTime: '09:30',
        status: 'confirmed',
        price: 45,
      },
      {
        tenantId: tenant1.id,
        clientId: clients1[1].id,
        professionalId: p3t1.id,
        serviceId: s3t1.id,
        date: today,
        startTime: '10:00',
        endTime: '11:00',
        status: 'pending',
        price: 70,
      },
      {
        tenantId: tenant1.id,
        clientId: clients1[2].id,
        professionalId: p2t1.id,
        serviceId: s4t1.id,
        date: today,
        startTime: '14:00',
        endTime: '15:30',
        status: 'pending',
        price: 80,
      },
    ],
    skipDuplicates: false,
  });

  console.log('✅ Tenant 1 (Barber Kings) criado');

  // ─── Tenant 2: Navalha de Ouro ──────────────────────────────────────────────
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'navalha-de-ouro' },
    update: {},
    create: {
      slug: 'navalha-de-ouro',
      name: 'Navalha de Ouro',
      ownerName: 'Felipe Santos',
      email: 'admin@navalha.com',
      phone: '(21) 99999-2222',
      address: 'Av. Brasil, 456 - Rio de Janeiro, RJ',
      status: 'active',
      plan: 'basic',
      monthlyPrice: 97,
      primaryColor: '#FFD700',
      isOpen: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@navalha.com' },
    update: {},
    create: {
      name: 'Felipe Santos',
      email: 'admin@navalha.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'tenant_admin',
      tenantId: tenant2.id,
    },
  });

  const [s1t2, s2t2, s3t2] = await Promise.all([
    prisma.service.upsert({
      where: { id: 's1t2-navalha' },
      update: {},
      create: { id: 's1t2-navalha', tenantId: tenant2.id, name: 'Corte Degradê', price: 50, duration: 40, category: 'Cabelo' },
    }),
    prisma.service.upsert({
      where: { id: 's2t2-navalha' },
      update: {},
      create: { id: 's2t2-navalha', tenantId: tenant2.id, name: 'Barba Completa', price: 40, duration: 35, category: 'Barba' },
    }),
    prisma.service.upsert({
      where: { id: 's3t2-navalha' },
      update: {},
      create: { id: 's3t2-navalha', tenantId: tenant2.id, name: 'Sobrancelha', price: 20, duration: 20, category: 'Estética' },
    }),
  ]);

  const [p1t2, p2t2] = await Promise.all([
    prisma.professional.upsert({
      where: { id: 'p1t2-navalha' },
      update: {},
      create: {
        id: 'p1t2-navalha',
        tenantId: tenant2.id,
        name: 'Felipe Barbosa',
        specialty: 'Cortes Modernos',
        workingHoursStart: '09:00',
        workingHoursEnd: '19:00',
        workingDays: [1, 2, 3, 4, 5, 6],
      },
    }),
    prisma.professional.upsert({
      where: { id: 'p2t2-navalha' },
      update: {},
      create: {
        id: 'p2t2-navalha',
        tenantId: tenant2.id,
        name: 'Thiago Lima',
        specialty: 'Barba e Estética',
        workingHoursStart: '10:00',
        workingHoursEnd: '18:00',
        workingDays: [1, 2, 3, 4, 5],
      },
    }),
  ]);

  await prisma.professionalService.createMany({
    data: [
      { professionalId: p1t2.id, serviceId: s1t2.id },
      { professionalId: p1t2.id, serviceId: s2t2.id },
      { professionalId: p2t2.id, serviceId: s2t2.id },
      { professionalId: p2t2.id, serviceId: s3t2.id },
    ],
    skipDuplicates: true,
  });

  // Criar usuários para os profissionais do Tenant 2
  await Promise.all([
    prisma.user.upsert({
      where: { email: 'felipe@navalha.com' },
      update: {},
      create: {
        name: 'Felipe Barbosa',
        email: 'felipe@navalha.com',
        passwordHash: await bcrypt.hash('prof123', 10),
        role: 'professional',
        tenantId: tenant2.id,
        professionalId: p1t2.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'thiago@navalha.com' },
      update: {},
      create: {
        name: 'Thiago Lima',
        email: 'thiago@navalha.com',
        passwordHash: await bcrypt.hash('prof123', 10),
        role: 'professional',
        tenantId: tenant2.id,
        professionalId: p2t2.id,
      },
    }),
  ]);

  console.log('✅ Tenant 2 (Navalha de Ouro) criado');

  // ─── Tenant 3: Barbearia Vintage ────────────────────────────────────────────
  const tenant3 = await prisma.tenant.upsert({
    where: { slug: 'barbearia-vintage' },
    update: {},
    create: {
      slug: 'barbearia-vintage',
      name: 'Barbearia Vintage',
      ownerName: 'Roberto Alves',
      email: 'admin@vintage.com',
      phone: '(31) 99999-3333',
      status: 'suspended',
      plan: 'basic',
      monthlyPrice: 97,
      primaryColor: '#8B4513',
      isOpen: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@vintage.com' },
    update: {},
    create: {
      name: 'Roberto Alves',
      email: 'admin@vintage.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'tenant_admin',
      tenantId: tenant3.id,
    },
  });

  console.log('✅ Tenant 3 (Barbearia Vintage) criado');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Contas de acesso:');
  console.log('  Super Admin : super@agendepro.com     / super123');
  console.log('  Admin T1    : admin@barber-kings.com  / admin123');
  console.log('  Admin T2    : admin@navalha.com       / admin123');
  console.log('  Admin T3    : admin@vintage.com       / admin123');
  console.log('  Prof. Carlos : carlos@barber-kings.com / prof123');
  console.log('  Prof. Ana    : ana@barber-kings.com   / prof123');
  console.log('  Prof. Marcos : marcos@barber-kings.com / prof123');
  console.log('  Prof. Felipe : felipe@navalha.com     / prof123');
  console.log('  Prof. Thiago : thiago@navalha.com     / prof123');
  console.log('\n🔗 Portal público:');
  console.log('  GET /api/public/barber-kings');
  console.log('  GET /api/public/navalha-de-ouro');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
