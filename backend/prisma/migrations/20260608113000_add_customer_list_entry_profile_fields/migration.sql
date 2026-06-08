-- Add profile fields for birthday template automation in customer list entries.
ALTER TABLE customer_list_entries
  ADD COLUMN birth_date DATE,
  ADD COLUMN gender TEXT,
  ADD COLUMN occupation TEXT;

CREATE INDEX customer_list_entries_customer_list_id_birth_date_idx
  ON customer_list_entries(customer_list_id, birth_date);
