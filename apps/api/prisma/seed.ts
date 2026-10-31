import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_THRESHOLDS = {
  lowMax: 30,
  mediumMax: 60,
  highMax: 80,
};

const DEFAULT_WEIGHTS = {
  mlWeight: 0.4,
  unknownDevice: 15,
  unknownIp: 10,
  failedAttemptUnit: 8,
  failedAttemptMax: 40,
  offHoursLogin: 10,
  deviceChanged: 12,
  ipChanged: 5,
};

async function main() {
  console.log('🌱 Commencing ZeroTrustX database seeding...');

  // 1. Seed or update Default Adaptive Risk Policy
  const existingPolicy = await prisma.riskPolicy.findFirst({
    where: { isActive: true },
  });

  if (!existingPolicy) {
    const policy = await prisma.riskPolicy.create({
      data: {
        name: 'Default Zero-Trust Adaptive Policy',
        description:
          'Baseline production adaptive access policy: 4-tier risk classification with ML & behavioral telemetry',
        thresholds: DEFAULT_THRESHOLDS,
        weights: DEFAULT_WEIGHTS,
        isActive: true,
        version: 1,
      },
    });
    console.log(`✅ Default Risk Policy initialized (ID: ${policy.id}, Version: ${policy.version})`);
  } else {
    console.log(`ℹ️  Active Risk Policy already exists (ID: ${existingPolicy.id}, Version: ${existingPolicy.version})`);
  }

  // 2. Security Notice for Initial Admin Setup
  console.log(`
========================================================================
🛡️  SECURITY NOTICE: INITIAL ADMINISTRATOR INITIALIZATION
========================================================================
In compliance with Zero-Trust architectural standards, NO default or
hardcoded admin accounts have been seeded into the database.

To create the initial administrator, issue a secure POST request to:
  POST /api/auth/bootstrap-admin

Payload:
{
  "email": "security-admin@yourdomain.com",
  "fullName": "Lead Security Officer",
  "password": "YourStrongPassword123!",
  "bootstrapSecret": "<ADMIN_BOOTSTRAP_SECRET from your .env>"
}

Ensure you clear or rotate ADMIN_BOOTSTRAP_SECRET after initial setup.
========================================================================
`);

  console.log('🌱 Seeding sequence completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
