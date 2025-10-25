# 🌐 Pridanie zbierania IP adresy používateľov

## ✅ Čo bolo pridané:

1. **API endpoint** (`api/saveChat.js`) - automaticky získava IP adresu z HTTP hlavičiek
2. **Databázový stĺpec** - `user_ip` VARCHAR(45) pre uloženie IPv4/IPv6 adresy
3. **SQL skripty** - pridané do `setup-database.sql` a nový `add-ip-column.sql`

---

## 🔧 Čo musíte urobiť:

### KROK 1: Pridajte stĺpec do Supabase tabuľky

Otvorte **Supabase Dashboard → SQL Editor** a spustite:

```sql
ALTER TABLE chat_logs 
ADD COLUMN IF NOT EXISTS user_ip VARCHAR(45);

CREATE INDEX IF NOT EXISTS idx_chat_logs_user_ip ON chat_logs(user_ip);
```

**ALEBO** spustite celý súbor: `add-ip-column.sql`

---

### KROK 2: Re-deploy na Vercel

```bash
vercel --prod
```

---

## 📊 Ako to funguje:

### Backend automaticky získava IP:
```javascript
// Zo všetkých možných zdrojov:
const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               'unknown';
```

### Vercel poskytuje IP v hlavičkách:
- `x-forwarded-for` - reálna IP používateľa (aj cez proxy)
- `x-real-ip` - alternatívna hlavička

### Ukladá do databázy:
```sql
INSERT INTO chat_logs (user_message, bot_response, website, user_ip)
VALUES ('...', '...', 'fphil.uniba.sk', '195.12.34.56');
```

---

## 🔍 Zobrazenie dát v Supabase:

```sql
-- Všetky záznamy s IP adresami
SELECT user_message, website, user_ip, created_at 
FROM chat_logs 
ORDER BY created_at DESC;

-- Počet chatov podľa IP adresy
SELECT user_ip, COUNT(*) as chat_count 
FROM chat_logs 
GROUP BY user_ip 
ORDER BY chat_count DESC;

-- Unikátne IP adresy
SELECT DISTINCT user_ip 
FROM chat_logs 
WHERE user_ip IS NOT NULL;
```

---

## 🛡️ Privacy & GDPR:

⚠️ **Dôležité upozornenie:**
- IP adresy sú osobné údaje podľa GDPR
- Uistite sa, že máte právny základ pre ich zbieranie
- Informujte používateľov v Privacy Policy
- Implementujte možnosť vymazania údajov

---

## ✅ Kontrolný zoznam:

- [ ] Stĺpec `user_ip` pridaný do tabuľky `chat_logs`
- [ ] Index vytvorený pre rýchlejšie vyhľadávanie
- [ ] Projekt re-deploynutý na Vercel
- [ ] Testovacia správa úspešne uloží IP adresu
- [ ] Privacy Policy aktualizovaná (odporúčané)

---

## 🧪 Test:

1. Otvorte chatbot a napíšte správu
2. Overte v Supabase: `SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 1`
3. Mali by ste vidieť IP adresu v stĺpci `user_ip`

---

**Poznámka:** IP adresy sú vo formáte:
- IPv4: `192.168.1.1`
- IPv6: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`
