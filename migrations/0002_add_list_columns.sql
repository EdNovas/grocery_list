-- Add name and category columns to shopping_list for resilience
-- This allows the shopping list to work even when products aren't in the products table
ALTER TABLE shopping_list ADD COLUMN name TEXT DEFAULT '';
ALTER TABLE shopping_list ADD COLUMN category TEXT DEFAULT '';
