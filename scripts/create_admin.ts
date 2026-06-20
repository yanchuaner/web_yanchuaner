import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { hash } from "bcryptjs";
import prisma from "../src/lib/db";
import {
  BCRYPT_COST,
  normalizeEmail,
  normalizeUsername,
  USERNAME_PATTERN,
  validEmail,
  validPassword,
} from "../src/lib/auth-utils";

async function main() {
  const rl = createInterface({ input, output });
  try {
    const username = normalizeUsername(await rl.question("管理员用户名: "));
    const email = normalizeEmail(await rl.question("管理员邮箱: "));
    const password = await rl.question("管理员密码: ");
    if (
      !USERNAME_PATTERN.test(username) ||
      !validEmail(email) ||
      !validPassword(password)
    ) {
      throw new Error("用户名、邮箱或密码格式不符合要求");
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (existing) throw new Error("用户名或邮箱已存在");
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hash(password, BCRYPT_COST),
        emailVerified: new Date(),
        name: username,
        role: "ADMIN",
        status: "VERIFIED",
        accountStatus: "ACTIVE",
        sessionVersion: 1,
      },
      select: { id: true, username: true, email: true },
    });
    console.log(`管理员已创建：${admin.username} (${admin.email})`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "创建管理员失败");
  process.exitCode = 1;
});
