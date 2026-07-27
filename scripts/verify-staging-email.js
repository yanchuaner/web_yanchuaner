const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { parse } = require("dotenv");
const { Resend } = require("resend");

const envPath = resolve(process.cwd(), process.argv[2] || ".env.staging");
const env = parse(readFileSync(envPath, "utf8"));

function required(name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function emailAddress(value) {
  const bracketed = value.match(/<([^>]+)>/);
  return (bracketed?.[1] || value).trim();
}

async function main() {
  const apiKey = required("RESEND_API_KEY");
  const from = required("RESEND_FROM_EMAIL");
  const recipient = required("STAGING_EMAIL_TEST_RECIPIENT");
  if (!/^\S+@\S+\.\S+$/.test(emailAddress(from))) throw new Error("RESEND_FROM_EMAIL is invalid");
  if (!/^\S+@\S+\.\S+$/.test(recipient)) throw new Error("STAGING_EMAIL_TEST_RECIPIENT is invalid");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: recipient,
    subject: "[Staging] 燕中邮件链路验收",
    text: "燕中生态 staging 邮件发送链路已成功连接。此邮件不包含真实用户数据。",
  });
  if (error) throw new Error(error.message || "Resend rejected the message");
  if (!data?.id) throw new Error("Resend did not return a message ID");
  console.log("PASS Resend accepted the staging verification message");
  console.log("Confirm delivery in the recipient inbox before marking the mail gate complete");
}

main().catch((error) => {
  console.error(`Staging email verification failed: ${error.message}`);
  process.exitCode = 1;
});
