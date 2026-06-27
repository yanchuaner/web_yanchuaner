import "dotenv/config";
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
import {
  normalizeClassName,
  normalizeGraduationClass,
  validClassName,
  validGraduationClass,
} from "../src/lib/identity-fields";

async function main() {
  const rl = createInterface({ input, output });
  try {
    const username = normalizeUsername(await rl.question("管理员用户名: "));
    const name = (await rl.question("真实姓名: ")).trim();
    const email = normalizeEmail(await rl.question("管理员邮箱: "));
    const password = await rl.question("管理员密码: ");
    const confirmPassword = await rl.question("确认密码: ");
    const graduationClass = normalizeGraduationClass(await rl.question("届别（例如：2025）: "));
    const className = normalizeClassName(await rl.question("班级（例如：2）: "));
    const contact = (await rl.question("联系方式（可选）: ")).trim();
    if (
      !USERNAME_PATTERN.test(username) ||
      !name ||
      name.length > 64 ||
      !validEmail(email) ||
      !validPassword(password) ||
      password !== confirmPassword ||
      !validGraduationClass(graduationClass) ||
      !validClassName(className) ||
      contact.length > 128
    ) {
      throw new Error("用户名、真实姓名、邮箱、密码、届别、班级或联系方式格式不符合要求");
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
        name,
        graduationClass,
        className,
        contact: contact || null,
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
