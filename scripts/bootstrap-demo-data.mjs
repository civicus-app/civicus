import { createServiceRoleClient, ensureDemoPolicies } from './lib/demo-test-utils.mjs';

const main = async () => {
  const serviceRoleClient = createServiceRoleClient();
  const { accounts, policies } = await ensureDemoPolicies(serviceRoleClient);

  console.log(`Prepared ${accounts.length} demo accounts and ${policies.length} demo policies.`);
  for (const policy of policies) {
    console.log(`${policy.status.padEnd(12)} ${policy.isPublished ? 'published' : 'hidden'} ${policy.title_en}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
