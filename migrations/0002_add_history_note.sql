-- Add note column to purchase_history
ALTER TABLE purchase_history ADD COLUMN note TEXT DEFAULT '';
