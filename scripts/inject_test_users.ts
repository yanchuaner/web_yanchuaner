import { hash } from "bcryptjs";
import prisma from "../src/lib/db";
import { BCRYPT_COST } from "../src/lib/auth-utils";

async function main() {
  console.log("开始注入测试账户...");

  // 1. 清理已有的同名测试账户
  const testUsernames = ["test", "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8", "test9"];
  const testEmails = [
    "yanchuaner@yanchuaner.cn",
    ...Array.from({ length: 9 }, (_, i) => `test${i + 1}@yanchuaner.cn`)
  ];

  await prisma.user.deleteMany({
    where: {
      OR: [
        { username: { in: testUsernames } },
        { email: { in: testEmails } }
      ]
    }
  });
  console.log("已清理冲突账户。");

  const passwordHash = await hash("88888888", BCRYPT_COST);

  // 2. 注入超级管理员 test (绑定的邮箱是系统内置默认的超级管理员邮箱 yanchuaner@yanchuaner.cn)
  const admin = await prisma.user.create({
    data: {
      username: "test",
      email: "yanchuaner@yanchuaner.cn",
      passwordHash,
      emailVerified: new Date(),
      name: "超级管理员",
      role: "ADMIN",
      status: "VERIFIED",
      accountStatus: "ACTIVE",
      sessionVersion: 1,
    }
  });
  console.log(`超级管理员账户创建成功: ${admin.username} (${admin.email})`);

  // 3. 注入普通用户 test1 到 test9 (设为已认证校友 ALUMNI，包含校友字段，方便直接测试前台页面)
  for (let i = 1; i <= 9; i++) {
    const username = `test${i}`;
    const email = `${username}@yanchuaner.cn`;
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        emailVerified: new Date(),
        name: `测试用户${i}`,
        role: "ALUMNI",
        status: "VERIFIED",
        accountStatus: "ACTIVE",
        sessionVersion: 1,
        graduationClass: "2025",
        className: "1班",
        city: "北京",
        university: "北京航空航天大学",
        major: "航空宇航科学与技术",
        industry: "航空航天",
      }
    });
    console.log(`普通校友账户创建成功: ${user.username} (${user.email})`);
  }

  console.log("所有测试账户注入完成！");
}

main()
  .catch((error) => {
    console.error("注入失败:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
