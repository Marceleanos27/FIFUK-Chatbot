# 🔧 Riešenie chyby "API responded with status 500"

## ❌ Chyba, ktorú vidíte:
```
Error saving chat to API: Error: API responded with status 500
```

## 🎯 Riešenie krok po kroku:

### KROK 1: Nainštalujte dependencies
```bash
npm install
```
Toto nainštaluje `@supabase/supabase-js`, ktorý je potrebný pre API endpoint.

---

### KROK 2: Skontrolujte Vercel Environment Variables

1. Otvorte **Vercel Dashboard**: https://vercel.com/dashboard
2. Vyberte váš projekt: **fifuk-chatbot**
3. Choďte do: **Settings → Environment Variables**
4. Skontrolujte, či existujú tieto premenné:

   ```
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Ak NEEXISTUJÚ, pridajte ich:**
   - Kliknite **Add New**
   - Name: `SUPABASE_URL`
   - Value: Vaša Supabase URL (nájdete v Supabase → Project Settings → API)
   - Environment: Production, Preview, Development (všetky)
   - Kliknite **Save**
   
   - Opakujte pre `SUPABASE_KEY` (použite **anon/public** kľúč)

6. **Po pridaní environment variables, RE-DEPLOY:**
   ```bash
   vercel --prod
   ```

---

### KROK 3: Vytvorte/Skontrolujte Supabase tabuľku

1. Otvorte **Supabase Dashboard**: https://supabase.com/dashboard
2. Vyberte váš projekt
3. Choďte do: **SQL Editor**
4. Spustite tento SQL kód (nachádza sa v súbore `setup-database.sql`):

```sql
-- Vytvorenie tabuľky
CREATE TABLE IF NOT EXISTS chat_logs (
  id BIGSERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_chat_logs_website ON chat_logs(website);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);

-- RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Politiky
DROP POLICY IF EXISTS "Allow public inserts" ON chat_logs;
CREATE POLICY "Allow public inserts" ON chat_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public reads" ON chat_logs;
CREATE POLICY "Allow public reads" ON chat_logs
  FOR SELECT USING (true);
```

5. Overte, že tabuľka existuje:
   - Choďte do **Table Editor**
   - Mali by ste vidieť tabuľku `chat_logs`

---

### KROK 4: Otestujte API

1. Otvorte súbor: **diagnostics.html** v prehliadači
2. Kliknite na: **▶️ Spustiť diagnostiku**
3. Skontrolujte výsledky

**Ak ešte stále nevidíte problém:**
- Kliknite na: **🧪 Test API volania**
- Prečítajte si presný error message

---

### KROK 5: Skontrolujte Vercel Logs

1. Choďte do **Vercel Dashboard**
2. Vyberte projekt: **fifuk-chatbot**
3. Kliknite na záložku: **Deployments**
4. Kliknite na najnovší deployment
5. Choďte do: **Functions**
6. Kliknite na `/api/saveChat`
7. Pozrite sa na **Logs** - tu uvidíte presný error

---

## 🔍 Bežné problémy a riešenia:

### ❌ "SUPABASE_URL or SUPABASE_KEY not set"
**Riešenie:** Pridajte environment variables vo Vercel (KROK 2)

### ❌ "relation 'chat_logs' does not exist"
**Riešenie:** Vytvorte tabuľku v Supabase (KROK 3)

### ❌ "permission denied for table chat_logs"
**Riešenie:** Skontrolujte RLS policies v Supabase (KROK 3)

### ❌ "Failed to fetch" alebo "Network error"
**Riešenie:** 
- Skontrolujte, či je projekt nasadený na Vercel
- Overte URL v `index.html` (malo by byť: `https://fifuk-chatbot.vercel.app`)

### ❌ "Cannot find package '@supabase/supabase-js'"
**Riešenie:** Spustite `npm install` a potom `vercel --prod`

---

## ✅ Kontrolný zoznam:

- [ ] `npm install` spustený
- [ ] `SUPABASE_URL` nastavený vo Vercel
- [ ] `SUPABASE_KEY` nastavený vo Vercel
- [ ] Projekt re-deploynutý na Vercel (`vercel --prod`)
- [ ] Tabuľka `chat_logs` existuje v Supabase
- [ ] RLS policies sú nastavené
- [ ] `diagnostics.html` test prešiel úspešne
- [ ] Chatbot ukladá správy bez chýb

---

## 🆘 Stále nefunguje?

1. Otvorte `diagnostics.html` a spustite test
2. Skopírujte presný error message z konzoly
3. Skontrolujte Vercel function logs
4. Skontrolujte Supabase logs (Dashboard → Logs)

---

## 📞 Quick Test

Po dokončení všetkých krokov:
1. Otvorte váš chatbot
2. Napíšte testovaciu správu
3. Stlačte F12 → Console
4. Mali by ste vidieť: **"Chat conversation saved successfully"**
5. Overte v Supabase: Table Editor → chat_logs

---

**Tip:** Upravený `api/saveChat.js` teraz poskytuje detailnejšie error messages. Po re-deployi by ste mali vidieť presný problém v konzole.
