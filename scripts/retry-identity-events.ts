import "dotenv/config";
import { deliverPendingIdentityEvents } from "../src/lib/identity-events";

async function main() {
  const summary = await deliverPendingIdentityEvents(100);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

void main();
