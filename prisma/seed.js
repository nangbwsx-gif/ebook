const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      slug: 'admin',
      role: 'ADMIN',
    },
  })
  console.log('Admin ready:', admin.username, '/', admin.slug)

  const demo = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      password: bcrypt.hashSync('demo123', 10),
      slug: 'demo',
      role: 'USER',
    },
  })
  console.log('Demo ready:', demo.username, '/', demo.slug)
}

main().catch(console.error).finally(() => prisma.$disconnect())
