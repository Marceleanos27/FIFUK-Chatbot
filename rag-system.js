// rag-system.js
// RAG (Retrieval-Augmented Generation) systém pre FIFUK Chatbot

class RAGSystem {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.stopWords = new Set([
      'a', 'je', 'to', 'na', 'v', 'sa', 'so', 'pre', 'ako', 'že', 'ma', 'mi', 'me', 'si', 'su', 'som',
      'ale', 'ani', 'az', 'ak', 'bo', 'by', 'co', 'ci', 'do', 'ho', 'im', 'ju', 'ka', 'ku', 'ly',
      'ne', 'ni', 'no', 'od', 'po', 'pri', 'ro', 'ta', 'te', 'ti', 'tu', 'ty', 'uz', 'vo', 'za'
    ]);
    
    // Synonymá pre lepšie vyhľadávanie (prispôsobené pre FiF UK)
    this.synonyms = {
      'profesor': ['profesorsky', 'profesura', 'profesor', 'inauguracny', 'inauguracia', 'inauguracne'],
      'docent': ['docentsky', 'docentura', 'docent', 'habilitacny', 'habilitacia', 'habilitacne'],
      'vyberove': ['vyberkone', 'vyberove', 'konanie', 'vyber', 'konkurz', 'selection'],
      'kriterium': ['kriteria', 'podmienky', 'poziadavky', 'requirements', 'predpoklady', 'minimalne'],
      'publikacia': ['publikacie', 'publikacny', 'vysledky', 'vystup', 'clanok', 'monografia', 'vysledok', 'vystupy'],
      'citacia': ['citacie', 'citovany', 'ohlas', 'ohlasovost', 'citation', 'ohlasy'],
      'projekt': ['projekty', 'vyskum', 'grant', 'vega', 'apvv', 'kega', 'vyskumny'],
      'doktorand': ['doktorandi', 'doktorandsky', 'dizertacia', 'phd', 'skolitel', 'dizertacny'],
      'katedra': ['katedry', 'pracovisko', 'oddelenie', 'department', 'kaa', 'kaka', 'kam', 'kdvu', 'kest', 'kfdf', 'kgns', 'kksf', 'kkiv', 'klmv', 'kmjl', 'kmk', 'kmuz', 'kped', 'kpol', 'kpr', 'kpsych', 'krom', 'krvs', 'ksf', 'ksd', 'ksjtk', 'ksllv', 'ksoc', 'kvd', 'kvas', 'kzur'],
      'dekan': ['dekana', 'dekanske', 'vedenie', 'fakulta'],
      'ucitel': ['ucitela', 'pedagogicky', 'pedagog', 'vyucba', 'vyucujuci', 'vysokoskolsky'],
      'zmluva': ['pracovny', 'pomer', 'contract', 'employment', 'obsadenie', 'pracovna'],
      'funkcia': ['funkcne', 'miesto', 'pozicia', 'position'],
      'studium': ['studijny', 'program', 'odbor', 'bakalarske', 'magisterske', 'doktorandske'],
      'komisia': ['vyberova', 'rada', 'committee', 'hodnotenie'],
      'ziadost': ['prihlaska', 'application', 'formular', 'dokumenty', 'registraturne', 'cislo'],
      'kontakt': ['spojenie', 'informacie', 'udaje', 'email', 'telefon', 'adresa', 'bakova', 'gabriela'],
      'termin': ['lehota', 'datum', 'cas', 'deadline', 'faza', 'tyzden', 'tyzdne'],
      'formular': ['formulare', 'ziadost', 'prihlaska', 'cast', 'casti', 'vyplnenie'],
      'priloha': ['prilohy', 'prilozit', 'nahrat', 'dokument', 'dokumenty', 'vupch', 'zivotopis'],
      'vzdelavanie': ['vzdelavacie', 'vzdelavacia', 'cinnost', 'pedagogicka', 'ucebnica', 'skriptum'],
      'vedecka': ['vedecky', 'vedeckovyskumna', 'vyskumna', 'tvoriva', 'umelecka', 'skola'],
      'kategoria': ['kategorie', 'a+', 'a', 'a-', 'v1', 'v2', 'v3', 'p1'],
      'wos': ['scopus', 'web', 'science', 'databaza', 'registrovany'],
      'opakované': ['opakovane', 'opakovat', 'znovu', 'obsadenie', 'obsadit'],
      'predpis': ['predpisy', 'vnutorny', 'smernica', 'zakon', 'legislativa', 'vp', '7/2024', '7/2025', '6/2025', '19/2022'],
      'suhas': ['suhlas', 'spracovanie', 'zverejnenie', 'gdpr', 'osobne', 'udaje'],
      'lektor': ['lektora', 'asistent', 'asistenta', 'odborny', 'pracovnik', 'pracovnika', 'vyskumny']
    };
  }

  // Hlavná metóda pre vyhľadávanie relevantného obsahu
  searchRelevantContent(query, maxResults = 5) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.extractKeywords(normalizedQuery);
    const bigrams = this.extractBigrams(normalizedQuery);
    const expandedWords = this.expandWithSynonyms(queryWords);
    
    if (queryWords.length === 0 && bigrams.length === 0) {
      return [];
    }

    const results = this.knowledgeBase.map(item => {
      const score = this.calculateRelevanceScore(item, expandedWords, normalizedQuery, bigrams);
      return { ...item, relevanceScore: score };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

    console.log('RAG Search Results:', results.map(r => ({ 
      id: r.id, 
      title: r.title, 
      category: r.category,
      score: r.relevanceScore.toFixed(2)
    })));
    
    // Ak je najvyššie skóre nízke, pridaj varovanie
    if (results.length > 0 && results[0].relevanceScore < 10) {
      console.log('⚠️ Nízka relevancia výsledkov - možno neexistuje presná odpoveď v databáze');
    }
    
    return results;
  }

  // Výpočet skóre relevancie (optimalizovaný pre FiF UK)
  calculateRelevanceScore(item, queryWords, fullQuery, bigrams = []) {
    let score = 0;
    const normalizedTitle = this.normalizeText(item.title);
    const normalizedContent = this.normalizeText(item.content);
    const normalizedKeywords = item.keywords.map(k => this.normalizeText(k));
    const normalizedCategory = this.normalizeText(item.category);
    
    // 1. Scoring pre kategóriu (prioritizácia podľa typu obsahu)
    queryWords.forEach(word => {
      if (normalizedCategory.includes(word)) {
        score += 4; // Zvýšený bonus za relevantnosť kategórie
      }
    });
    
    // 2. Scoring pre jednotlivé slová
    queryWords.forEach(word => {
      // Kľúčové slová (najvyššia priorita)
      const keywordMatch = normalizedKeywords.some(keyword => 
        keyword.includes(word) || word.includes(keyword) || this.isSimilar(word, keyword)
      );
      if (keywordMatch) {
        score += 8; // Zvýšená váha pre keywords
      }
      
      // Názov
      if (normalizedTitle.includes(word)) {
        score += 6; // Zvýšené skóre pre title match
      }
      
      // Obsah (s TF-IDF boost pre zriedkavé slová)
      if (normalizedContent.includes(word)) {
        const frequency = (normalizedContent.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(frequency * 1.5, 6); // Zvýšený max na 6 bodov
      }
    });

    // 3. Scoring pre bigramy (2-slovné frázy)
    bigrams.forEach(bigram => {
      if (normalizedContent.includes(bigram) || normalizedTitle.includes(bigram)) {
        score += 7; // Zvýšené skóre pre presné frázy
      }
      normalizedKeywords.forEach(keyword => {
        if (keyword.includes(bigram)) {
          score += 10; // Extra vysoké skóre pre bigram v keywords
        }
      });
    });

    // 4. Bonus za presný match celej frázy
    if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
      score += 12; // Zvýšený bonus za presný match
    }

    // 5. Bonus za čísla (roky, čísla predpisov, telefónne čísla)
    const numbers = fullQuery.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => {
        if (normalizedContent.includes(num) || normalizedTitle.includes(num)) {
          score += 5; // Zvýšený bonus za zhodu čísel
        }
      });
    }

    // 6. Bonus za ID match (napr. VP_7_2025)
    if (item.id && fullQuery.includes(item.id.toString().toLowerCase())) {
      score += 20; // Veľký bonus za priamy match ID
    }
    
    // 7. Bonus za špecifické výberové konanie frázy
    const vcPhrases = ['vyberove konanie', 'vyberove konania', 'vyberovom konani', 'vyberoveho konania'];
    if (vcPhrases.some(phrase => fullQuery.includes(phrase))) {
      if (normalizedCategory.includes('vyberove konanie')) {
        score += 5;
      }
    }
    
    // 8. Bonus za kritériá - rozlišovanie medzi docentskými a profesorskými
    const isDocentQuery = queryWords.some(w => ['docent', 'docentsky', 'habilitacny', 'habilitacia'].includes(w));
    const isProfesorQuery = queryWords.some(w => ['profesor', 'profesorsky', 'inauguracny', 'inauguracia'].includes(w));
    
    if (isDocentQuery && normalizedCategory.includes('habilitacne')) {
      score += 6;
    }
    if (isProfesorQuery && normalizedCategory.includes('inauguracne')) {
      score += 6;
    }
    
    // 9. Bonus za formulár a konkrétne časti
    const castMatch = fullQuery.match(/cast\s*(\d+)/);
    if (castMatch && normalizedTitle.includes('cast ' + castMatch[1])) {
      score += 8;
    }
    
    // 10. Bonus za link - ak je uvedený link, je to často dôležitý zdroj
    if (item.link && item.link !== '') {
      score += 2;
    }

    return score;
  }

  // Extrakcia kľúčových slov z dotazu
  extractKeywords(normalizedText) {
    return normalizedText
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .slice(0, 15); // Zvýšené z 12 na 15 pre komplexnejšie dotazy
  }

  // Extrakcia bigramov (2-slovné frázy)
  extractBigrams(normalizedText) {
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    const bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      // Preskočiť bigramy kde sú OBE slová stop words
      if (!(this.stopWords.has(words[i]) && this.stopWords.has(words[i + 1]))) {
        bigrams.push(bigram);
      }
    }
    
    return bigrams;
  }

  // Extrakcia trigramov (3-slovné frázy) pre ešte presnejšie vyhľadávanie
  extractTrigrams(normalizedText) {
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    const trigrams = [];
    
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      trigrams.push(trigram);
    }
    
    return trigrams;
  }

  // Rozšírenie slov o synonymá
  expandWithSynonyms(words) {
    const expanded = new Set(words);
    
    words.forEach(word => {
      // Nájdi synonymá pre toto slovo
      for (const [key, synonymList] of Object.entries(this.synonyms)) {
        if (key === word || synonymList.includes(word)) {
          // Pridaj kľúčové slovo
          expanded.add(key);
          // Pridaj všetky synonymá
          synonymList.forEach(syn => expanded.add(syn));
        }
      }
    });
    
    return Array.from(expanded);
  }

  // Kontrola podobnosti slov (fuzzy matching pre preklepy)
  isSimilar(word1, word2) {
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > 2) return false;
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Levenshtein distance - tolerancia max 1-2 preklepy
    const maxChanges = word1.length > 6 ? 2 : 1;
    let changes = 0;
    const maxLen = Math.max(word1.length, word2.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (word1[i] !== word2[i]) changes++;
      if (changes > maxChanges) return false;
    }
    
    return changes <= maxChanges;
  }

  // Normalizácia textu
  normalizeText(text) {
    if (!text) return '';
    
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Odstránenie diakritiky
      .replace(/[^\w\sáäčďéíĺľňóôŕšťúýž]/g, ' ') // Zachovanie slovenských znakov
      .replace(/\s+/g, ' ')
      .trim();
  }



  // Vytvorenie kontextu pre AI model
  buildContext(relevantContent) {
    if (relevantContent.length === 0) {
      return '';
    }
    
    const context = relevantContent
      .map((item, index) => {
        let contextPart = `**${index + 1}. ${item.title}** [${item.category}]`;
        if (item.id) {
          contextPart += ` (ID: ${item.id})`;
        }
        contextPart += `:\n${item.content}`;
        
        // Pridaj link ak existuje
        if (item.link && item.link !== '') {
          contextPart += `\n📎 Link: ${item.link}`;
        }
        
        return contextPart;
      })
      .join('\n\n');
    
    // Kontrola či obsahuje kontaktné informácie
    const hasContactInfo = relevantContent.some(item => 
      item.category === 'Kontaktné informácie' || 
      item.keywords.some(kw => ['kontakt', 'email', 'telefon', 'bakova', 'gabriela'].includes(kw.toLowerCase()))
    );
    
    // Kontrola či ide o kritériá (habilitačné alebo inauguračné)
    const hasHabilitacneCriteria = relevantContent.some(item => 
      item.category.includes('Habilitačné kritériá')
    );
    
    const hasInauguracneCriteria = relevantContent.some(item => 
      item.category.includes('Inauguračné kritériá')
    );
    
    // Kontrola či ide o vnútorné predpisy
    const hasVnutornePredpisy = relevantContent.some(item => 
      item.category.includes('Vnútorné predpisy')
    );
    
    // Kontrola či ide o formulár
    const hasFormular = relevantContent.some(item => 
      item.category.includes('Formulár')
    );
    
    // Kontrola či ide o prílohy
    const hasPrilohy = relevantContent.some(item => 
      item.category.includes('Prílohy')
    );
    
    // Kontrola či ide o opakované obsadenie
    const hasOpakovaneObsadenie = relevantContent.some(item => 
      item.category.includes('Opakované obsadenie')
    );
    
    const contactNote = hasContactInfo 
      ? '\n\n⚠️ KONTAKTY: Pri odpovedaní na otázky o kontaktoch použi PRESNE uvedené kontaktné údaje (email, telefón, meno). Neuvádzaj žiadne iné kontakty. Gabriela Baková pracuje v Kancelárii dekana.'
      : '';
    
    const habilitacneNote = hasHabilitacneCriteria
      ? '\n\n📋 HABILITAČNÉ KRITÉRIÁ: Uvádzaj presné minimálne požiadavky pre docentov. Rozlišuj medzi kategóriami A+, A, A- a ich počtami. Pri nejasnostiach odporuč kontakt na zodpovednú osobu.'
      : '';
    
    const inauguracneNote = hasInauguracneCriteria
      ? '\n\n📋 INAUGURAČNÉ KRITÉRIÁ: Uvádzaj presné minimálne požiadavky pre profesorov. Rozlišuj medzi kategóriami A+, A, A- a ich počtami. Vyššie požiadavky ako pre docentov. Pri nejasnostiach odporuč kontakt na zodpovednú osobu.'
      : '';
    
    const predpisNote = hasVnutornePredpisy
      ? '\n\n📜 VNÚTORNÉ PREDPISY: Pri odkazovaní na predpisy uvádzaj ich presné čísla (napr. VP č. 7/2024, VP č. 6/2025, VP č. 19/2022). Ak je uvedený link, odporuč ho používateľovi.'
      : '';
    
    const formularNote = hasFormular
      ? '\n\n📝 FORMULÁR: Vysvetľuj jednotlivé časti formulára postupne a zrozumiteľne. Upozorni na povinné polia označené hviezdičkou.'
      : '';
    
    const prilohaNote = hasPrilohy
      ? '\n\n📎 PRÍLOHY: Vysvetľuj, ktoré prílohy sú povinné a ktoré nie. Upozorni na špecifické požiadavky pre jednotlivé prílohy (napr. VUPCH, doklady o vzdelaní).'
      : '';
    
    const opakovaneNote = hasOpakovaneObsadenie
      ? '\n\n🔄 OPAKOVANÉ OBSADENIE: Rozlišuj medzi podmienkami pre opakované obsadenie docenta, profesora a postup z docenta na profesora. Pozor na požiadavky V1, V2, V3, P1 a ich kombinácie.'
      : '';
    
    return `PRESNÉ INFORMÁCIE O FILOZOFICKEJ FAKULTE UK (používaj LEN tieto fakty):\n\n${context}\n\n📌 INŠTRUKCIE: Odpovedaj PRESNE podľa týchto informácií z databázy FiF UK. NEPRÍDÁVAJ žiadne vlastné interpretácie alebo detaily, ktoré nie sú explicitne uvedené v kontexte. Ak informácia nie je v kontexte, POVEDZ to a odporuč kontaktovanie zodpovednej osoby (Gabriela Baková, gabriela.bakova@uniba.sk).${contactNote}${habilitacneNote}${inauguracneNote}${predpisNote}${formularNote}${prilohaNote}${opakovaneNote}`;
  }

  // Vyhľadávanie podľa ID
  getById(id) {
    return this.knowledgeBase.find(item => item.id === id);
  }

  // Vyhľadávanie podľa kategórie
  getByCategory(category) {
    return this.knowledgeBase.filter(item => 
      item.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Vyhľadávanie podľa kľúčových slov
  getByKeyword(keyword) {
    const normalized = this.normalizeText(keyword);
    return this.knowledgeBase.filter(item =>
      item.keywords.some(kw => this.normalizeText(kw).includes(normalized))
    );
  }

  // Získanie štatistík databázy
  getStats() {
    const categories = [...new Set(this.knowledgeBase.map(item => item.category))];
    return {
      totalItems: this.knowledgeBase.length,
      categories: categories,
      categoryCounts: categories.map(cat => ({
        category: cat,
        count: this.knowledgeBase.filter(item => item.category === cat).length
      }))
    };
  }
}

// Export pre použitie v iných súboroch
if (typeof window !== 'undefined') {
  window.RAGSystem = RAGSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGSystem;
}

