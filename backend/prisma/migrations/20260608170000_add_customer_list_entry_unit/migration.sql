-- Add source unit/department field for customer-list birthday templates.
ALTER TABLE customer_list_entries
  ADD COLUMN unit TEXT;
