import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@football.com'
  const plainPassword = 'Admin@123'

  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isActive: true,
    },
    create: {
      email,
      password: hashedPassword,
      isActive: true,
    },
  })

  console.log('✓ Admin user seeded:')
  console.log('  Email   :', admin.email)
  console.log('  Password:', plainPassword)
  console.log('  ID      :', admin.id)
  console.log('\n  ⚠️  Change the password after first login in production!')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
