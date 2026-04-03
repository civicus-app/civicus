import { createServiceRoleClient, ensureDemoAccounts } from './lib/demo-test-utils.mjs';

const main = async () => {
  const serviceRoleClient = createServiceRoleClient();
  const accounts = await ensureDemoAccounts(serviceRoleClient);

  for (const account of accounts) {
    console.log(`ready ${account.email} (${account.expectedRole})`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
