import { PGlite } from '@electric-sql/pglite';

// Initialize PGlite with IndexedDB persistence
export const db = new PGlite('idb://invoice-generator-db-v2');

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
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

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

    -- Add new columns to existing invoices table if they don't exist
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0;
      EXCEPTION WHEN duplicate_column THEN END;
      
      BEGIN
        ALTER TABLE invoices ADD COLUMN tax_name TEXT;
      EXCEPTION WHEN duplicate_column THEN END;
      
      BEGIN
        ALTER TABLE invoices ADD COLUMN tax_rate DECIMAL(10, 2) DEFAULT 0;
      EXCEPTION WHEN duplicate_column THEN END;
      
      BEGIN
        ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0;
      EXCEPTION WHEN duplicate_column THEN END;
      
      BEGIN
        ALTER TABLE invoices ADD COLUMN po_number TEXT;
      EXCEPTION WHEN duplicate_column THEN END;
    END $$;
  `);
}
