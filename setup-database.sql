-- =====================================================
-- SQL SKRIPT PRE VYTVORENIE TABUĽKY chat_logs
-- Spustite tento kód v Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Vytvorenie tabuľky chat_logs
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  user_ip VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Vytvorenie indexov pre rýchlejšie vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_chat_logs_website ON chat_logs(website);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);

-- 3. Povolenie Row Level Security (RLS)
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- 4. Vytvorenie politiky pre INSERT (povoliť všetkým)
DROP POLICY IF EXISTS "Allow public inserts" ON chat_logs;
CREATE POLICY "Allow public inserts" ON chat_logs
  FOR INSERT
  WITH CHECK (true);

-- 5. Vytvorenie politiky pre SELECT (povoliť všetkým)
DROP POLICY IF EXISTS "Allow public reads" ON chat_logs;
CREATE POLICY "Allow public reads" ON chat_logs
  FOR SELECT
  USING (true);

-- =====================================================
-- OVERENIE: Skontrolujte, či tabuľka bola vytvorená
-- =====================================================

-- Zobraziť štruktúru tabuľky
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'chat_logs'
ORDER BY ordinal_position;

-- Zobraziť všetky policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'chat_logs';

-- =====================================================
-- TEST: Vložte testovací záznam
-- =====================================================

INSERT INTO chat_logs (user_message, bot_response, website, user_ip)
VALUES ('Test správa', 'Test odpoveď', 'test.com', '192.168.1.1');

-- Overte, že sa záznam uložil
SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- POZNÁMKY:
-- =====================================================
-- 1. Tento skript je bezpečný - používa IF NOT EXISTS a DROP IF EXISTS
-- 2. RLS policies povoľujú INSERT a SELECT všetkým (upravte podľa potrieb)
-- 3. Indexy zrýchlia vyhľadávanie podľa website, dátumu a IP adresy
-- 4. created_at sa automaticky nastaví na aktuálny čas
-- 5. user_ip zbiera IPv4 alebo IPv6 adresu používateľa
