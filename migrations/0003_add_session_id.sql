-- Add session_id to purchase_history for per-checkout grouping
-- Each checkout generates a unique UUID; same-session items share the same session_id
ALTER TABLE purchase_history ADD COLUMN session_id TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_history_session ON purchase_history(session_id);
