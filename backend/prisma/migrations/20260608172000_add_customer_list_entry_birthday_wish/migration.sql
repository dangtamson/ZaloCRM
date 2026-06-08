-- Add per-entry birthday wish text for automation birthday templates.
ALTER TABLE customer_list_entries
  ADD COLUMN birthday_wish TEXT;
