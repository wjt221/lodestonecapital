/**
 * Database seed for Lodestone Capital
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ----------------------------------------------------------------
  // Users
  // ----------------------------------------------------------------
  const passwordHash = await bcrypt.hash('Lodestone2025!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lodestonecapital.com' },
    update: {},
    create: {
      email: 'admin@lodestonecapital.com',
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
      passwordHash,
      isActive: true,
      emailVerified: new Date(),
    },
  })

  const partner = await prisma.user.upsert({
    where: { email: 'partner@lodestonecapital.com' },
    update: {},
    create: {
      email: 'partner@lodestonecapital.com',
      name: 'Sarah Chen',
      role: 'MANAGING_PARTNER',
      passwordHash,
      isActive: true,
      emailVerified: new Date(),
    },
  })

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@lodestonecapital.com' },
    update: {},
    create: {
      email: 'analyst@lodestonecapital.com',
      name: 'James Park',
      role: 'ANALYST',
      passwordHash,
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log('✓ Users created')

  // ----------------------------------------------------------------
  // Fund
  // ----------------------------------------------------------------
  const fund = await prisma.fund.upsert({
    where: { id: 'clseed000000000000000fund1' },
    update: {},
    create: {
      id: 'clseed000000000000000fund1',
      name: 'Lodestone Capital Fund I',
      vintageYear: 2022,
      strategy: 'Private Equity',
      targetSize: 250_000_000,
      committedCapital: 185_000_000,
      calledCapital: 120_000_000,
      distributedCapital: 8_500_000,
      nav: 145_000_000,
    },
  })

  console.log('✓ Fund created')

  // ----------------------------------------------------------------
  // Companies
  // ----------------------------------------------------------------
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'clseed000000000000company1' },
      update: {},
      create: {
        id: 'clseed000000000000company1',
        name: 'Meridian Health Technologies',
        sector: 'Healthcare',
        subSector: 'Health IT',
        headquarters: 'Boston, MA',
        website: 'https://meridianhealth.example.com',
        employeeCount: 320,
        yearFounded: 2018,
        description: 'AI-powered clinical workflow automation for mid-market hospital systems.',
      },
    }),
    prisma.company.upsert({
      where: { id: 'clseed000000000000company2' },
      update: {},
      create: {
        id: 'clseed000000000000company2',
        name: 'Apex Industrial Services',
        sector: 'Industrials',
        subSector: 'Facility Management',
        headquarters: 'Houston, TX',
        website: 'https://apexindustrial.example.com',
        employeeCount: 870,
        yearFounded: 2011,
        description: 'Specialty industrial maintenance and inspection services for energy sector.',
      },
    }),
    prisma.company.upsert({
      where: { id: 'clseed000000000000company3' },
      update: {},
      create: {
        id: 'clseed000000000000company3',
        name: 'Clearwater Financial',
        sector: 'Financial Services',
        subSector: 'Payments',
        headquarters: 'Chicago, IL',
        website: 'https://clearwaterfinancial.example.com',
        employeeCount: 210,
        yearFounded: 2016,
        description: 'B2B payment infrastructure for regional banks and credit unions.',
      },
    }),
    prisma.company.upsert({
      where: { id: 'clseed000000000000company4' },
      update: {},
      create: {
        id: 'clseed000000000000company4',
        name: 'Summit Logistics Group',
        sector: 'Industrials',
        subSector: 'Supply Chain',
        headquarters: 'Atlanta, GA',
        website: 'https://summitlogistics.example.com',
        employeeCount: 550,
        yearFounded: 2014,
        description: 'Last-mile cold chain logistics for food & beverage manufacturers.',
      },
    }),
  ])

  console.log('✓ Companies created')

  // ----------------------------------------------------------------
  // Deals
  // ----------------------------------------------------------------
  const deals = await Promise.all([
    prisma.deal.upsert({
      where: { id: 'clseed00000000000000deal01' },
      update: {},
      create: {
        id: 'clseed00000000000000deal01',
        name: 'Project Meridian',
        companyId: companies[0].id,
        stage: 'DILIGENCE',
        sector: 'Healthcare',
        geography: 'Northeast US',
        sourceChannel: 'intermediary',
        dataClassification: 'CONFIDENTIAL',
        priority: 4,
        checkSizeMin: 15_000_000,
        checkSizeMax: 25_000_000,
        entryValuation: 90_000_000,
        targetOwnership: 0.275,
        revenue: 22_000_000,
        ebitda: 5_500_000,
        description: 'AI-powered clinical workflow platform with 40+ hospital customers. Strong NRR of 118%. Management team has strong prior exit history.',
        tags: ['healthcare-IT', 'AI', 'recurring-revenue'],
        assignments: {
          create: { userId: partner.id, role: 'lead', isPrimary: true },
        },
      },
    }),
    prisma.deal.upsert({
      where: { id: 'clseed00000000000000deal02' },
      update: {},
      create: {
        id: 'clseed00000000000000deal02',
        name: 'Project Apex',
        companyId: companies[1].id,
        stage: 'IC_REVIEW',
        sector: 'Industrials',
        geography: 'Gulf Coast',
        sourceChannel: 'proprietary',
        dataClassification: 'CONFIDENTIAL',
        priority: 5,
        checkSizeMin: 30_000_000,
        checkSizeMax: 45_000_000,
        entryValuation: 140_000_000,
        targetOwnership: 0.325,
        revenue: 48_000_000,
        ebitda: 12_000_000,
        description: 'Market-leading specialty services company with long-term energy sector contracts. Recession-resilient revenue base.',
        tags: ['industrials', 'services', 'energy'],
        assignments: {
          create: { userId: partner.id, role: 'lead', isPrimary: true },
        },
      },
    }),
    prisma.deal.upsert({
      where: { id: 'clseed00000000000000deal03' },
      update: {},
      create: {
        id: 'clseed00000000000000deal03',
        name: 'Project Clearwater',
        companyId: companies[2].id,
        stage: 'SCREENING',
        sector: 'Financial Services',
        geography: 'Midwest',
        sourceChannel: 'inbound',
        dataClassification: 'CONFIDENTIAL',
        priority: 3,
        checkSizeMin: 10_000_000,
        checkSizeMax: 18_000_000,
        entryValuation: 55_000_000,
        targetOwnership: 0.30,
        revenue: 11_000_000,
        ebitda: 3_200_000,
        description: 'Payments infrastructure for community banks. Unique regulatory moat.',
        tags: ['fintech', 'payments', 'B2B'],
        assignments: {
          create: { userId: analyst.id, role: 'lead', isPrimary: true },
        },
      },
    }),
    prisma.deal.upsert({
      where: { id: 'clseed00000000000000deal04' },
      update: {},
      create: {
        id: 'clseed00000000000000deal04',
        name: 'Project Summit',
        companyId: companies[3].id,
        stage: 'SOURCING',
        sector: 'Industrials',
        geography: 'Southeast US',
        sourceChannel: 'outbound',
        dataClassification: 'CONFIDENTIAL',
        priority: 2,
        description: 'Cold chain logistics company. Early-stage outreach.',
        tags: ['logistics', 'cold-chain'],
        assignments: {
          create: { userId: analyst.id, role: 'lead', isPrimary: true },
        },
      },
    }),
    prisma.deal.upsert({
      where: { id: 'clseed00000000000000deal05' },
      update: {},
      create: {
        id: 'clseed00000000000000deal05',
        name: 'Project Horizon (Passed)',
        companyId: companies[0].id,
        stage: 'PASSED',
        sector: 'Technology',
        geography: 'West Coast',
        sourceChannel: 'inbound',
        dataClassification: 'CONFIDENTIAL',
        priority: 1,
        description: 'SaaS deal — valuation expectations misaligned.',
        tags: ['passed'],
        assignments: {
          create: { userId: partner.id, role: 'lead', isPrimary: true },
        },
      },
    }),
  ])

  console.log('✓ Deals created')

  // ----------------------------------------------------------------
  // Portfolio Company (Apex is a portfolio investment)
  // ----------------------------------------------------------------
  const portfolioCo = await prisma.portfolioCompany.upsert({
    where: { id: 'clseed0000000000portfolioco1' },
    update: {},
    create: {
      id: 'clseed0000000000portfolioco1',
      fundId: fund.id,
      companyId: companies[1].id,
      investmentDate: new Date('2023-06-15'),
      totalInvested: 38_000_000,
      currentValuation: 52_000_000,
      currentOwnership: 0.325,
      moic: 1.37,
      irr: 0.182,
      valuationDate: new Date('2024-12-31'),
      valuationMethod: 'MARKET_COMPS',
      isActive: true,
    },
  })

  // Add a KPI entry
  await prisma.portfolioKPI.upsert({
    where: { id: 'clseed000000000000000kpi01' },
    update: {},
    create: {
      id: 'clseed000000000000000kpi01',
      portfolioCompanyId: portfolioCo.id,
      period: '2024-12',
      revenue: 51_000_000,
      ebitda: 13_200_000,
      headcount: 892,
      revenueVsPlan: 1.06,
      dataClassification: 'CONFIDENTIAL',
    },
  })

  console.log('✓ Portfolio created')

  // ----------------------------------------------------------------
  // Contacts
  // ----------------------------------------------------------------
  await Promise.all([
    prisma.contact.upsert({
      where: { id: 'clseed000000000000contact1' },
      update: {},
      create: {
        id: 'clseed000000000000contact1',
        firstName: 'Michael',
        lastName: 'Torres',
        email: 'mtorres@meridianhealth.example.com',
        title: 'CEO & Co-Founder',
        companyId: companies[0].id,
        isFounder: true,
        location: 'Boston, MA',
        bio: 'Former VP Product at Epic Systems. Co-founded Meridian in 2018 with vision to automate clinical workflows using AI.',
        dataClassification: 'INTERNAL',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'clseed000000000000contact2' },
      update: {},
      create: {
        id: 'clseed000000000000contact2',
        firstName: 'Patricia',
        lastName: 'Nguyen',
        email: 'pnguyen@harborlp.example.com',
        title: 'Managing Director',
        isLP: true,
        isInvestor: true,
        location: 'New York, NY',
        bio: 'Managing Director at Harbor Endowment. Responsible for private equity allocations.',
        dataClassification: 'CONFIDENTIAL',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'clseed000000000000contact3' },
      update: {},
      create: {
        id: 'clseed000000000000contact3',
        firstName: 'Robert',
        lastName: 'Walsh',
        email: 'rwalsh@apexindustrial.example.com',
        title: 'CEO',
        companyId: companies[1].id,
        isFounder: false,
        location: 'Houston, TX',
        bio: 'Third-generation industrial services entrepreneur. Has grown Apex from $5M to $48M revenue over 8 years.',
        dataClassification: 'INTERNAL',
      },
    }),
  ])

  console.log('✓ Contacts created')

  // ----------------------------------------------------------------
  // Audit log entries
  // ----------------------------------------------------------------
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        userEmail: admin.email,
        userRole: admin.role,
        action: 'provision',
        resourceType: 'User',
        resourceId: partner.id,
        metadata: { result: 'success', targetEmail: partner.email },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        integrityHash: 'seed',
        dataClassification: 'INTERNAL',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: partner.id,
        userEmail: partner.email,
        userRole: partner.role,
        action: 'create',
        resourceType: 'Deal',
        resourceId: deals[0].id,
        metadata: { result: 'success', dealName: deals[0].name },
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
        integrityHash: 'seed',
        dataClassification: 'CONFIDENTIAL',
      },
    }),
  ])

  console.log('✓ Audit log seeded')

  console.log('\n✅ Seed complete!')
  console.log('\nDemo accounts (password: Lodestone2025!):')
  console.log('  admin@lodestonecapital.com  (SUPER_ADMIN)')
  console.log('  partner@lodestonecapital.com (MANAGING_PARTNER)')
  console.log('  analyst@lodestonecapital.com (ANALYST)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
