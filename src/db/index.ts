import { PGlite } from "@electric-sql/pglite";

// Initialize PGlite with OPFS persistence (Sovereign Web Protocol: Near-native disk I/O)
export const db = new PGlite("opfs://sovereignty-invoice-db-v3");

export async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY,
      client_id UUID REFERENCES clients(id),
      invoice_number TEXT NOT NULL,
      po_number TEXT,
      date TIMESTAMP NOT NULL,
      due_date TIMESTAMP,
      status TEXT DEFAULT 'draft',
      subtotal DECIMAL(10, 2) DEFAULT 0,
      tax_name TEXT,
      tax_rate DECIMAL(10, 2) DEFAULT 0,
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      total DECIMAL(10, 2) DEFAULT 0,
      paid_amount DECIMAL(10, 2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add paid_amount if it doesn't exist (primitive migration)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='paid_amount') THEN
        ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0;
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS invoice_items (
      id UUID PRIMARY KEY,
      invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity DECIMAL(10, 2) DEFAULT 1,
      unit_price DECIMAL(10, 2) DEFAULT 0,
      amount DECIMAL(10, 2) DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Performance Indices
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
  `);
}
