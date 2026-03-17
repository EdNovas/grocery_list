-- Smart Grocery List - D1 Schema

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Products (system + user-custom)
CREATE TABLE IF NOT EXISTS products (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  name_en           TEXT,
  emoji             TEXT NOT NULL DEFAULT '🛒',
  category          TEXT NOT NULL,
  default_freq_days INTEGER NOT NULL DEFAULT 7,
  tags              TEXT DEFAULT '[]',
  is_system         INTEGER DEFAULT 1,
  created_by        INTEGER REFERENCES users(id)
);

-- User-specific frequency overrides
CREATE TABLE IF NOT EXISTS user_frequencies (
  user_id    INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  freq_days  INTEGER NOT NULL,
  PRIMARY KEY (user_id, product_id)
);

-- Shopping list
CREATE TABLE IF NOT EXISTS shopping_list (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  quantity   INTEGER DEFAULT 1,
  note       TEXT DEFAULT '',
  completed  INTEGER DEFAULT 0,
  added_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

-- Purchase history
CREATE TABLE IF NOT EXISTS purchase_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id) NOT NULL,
  product_id    INTEGER REFERENCES products(id) NOT NULL,
  quantity      INTEGER DEFAULT 1,
  purchased_at  TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_list_user ON shopping_list(user_id);
CREATE INDEX IF NOT EXISTS idx_list_user_completed ON shopping_list(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_history_user ON purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_product ON purchase_history(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_system ON products(is_system);
