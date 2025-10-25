-- =================a====================================
-- PRIDANIE STĹPCA user_ip DO TABUĽKY chat_logs
-- Spustite tento kód v Supabase Dashboard → SQL Editor
-- =====================================================

-- Pridanie stĺpca user_ip (ak ešte neexistuje)
ALTER TABLE chat_logs 
ADD COLUMN IF NOT EXISTS user_ip VARCHAR(45);

-- Vytvorenie indexu pre rýchlejšie vyhľadávanie podľa IP
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);

-- Aktualizácia komentára pre stĺpec (voliteľné, len pre dokumentáciu)
COMMENT ON COLUMN chat_logs.user_ip IS 'IP adresa používateľa (IPv4 alebo IPv6)';

-- =====================================================
-- OVERENIE: Skontrolujte, či stĺpec bol pridaný
-- =====================================================

SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_logs'
ORDER BY ordinal_position;

-- =====================================================
-- TEST: Vložte testovací záznam s IP adresou
-- =====================================================

INSERT INTO chat_logs (user_message, bot_response, website, user_ip)
VALUES ('Test správa s IP', 'Test odpoveď', 'test.com', '192.168.1.1');

-- Overte, že sa záznam uložil
SELECT id, user_message, website, user_ip, created_at 
FROM chat_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- POZNÁMKY:
-- =====================================================
-- 1. VARCHAR(45) je dostatočné pre IPv4 (15 znakov) aj IPv6 (max 39 znakov)
-- 2. Stĺpec je nullable - ak IP nie je dostupná, uloží sa NULL
-- 3. Index zrýchli vyhľadávanie podľa IP adresy
