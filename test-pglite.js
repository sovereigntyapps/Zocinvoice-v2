import { PGlite } from '@electric-sql/pglite';

async function main() {
  const db = new PGlite('opfs://sovereignty');
  await db.exec('CREATE TABLE IF NOT EXISTS test (id INT);');
  console.log('done');
}
main().catch(console.error);
