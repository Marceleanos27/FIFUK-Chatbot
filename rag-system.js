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
      'profesor': ['profesorsky', 'profesura', 'profesor', 'inauguracny', 'inauguracia'],
      'docent': ['docentsky', 'docentura', 'docent', 'habilitacny', 'habilitacia'],
      'vyberkone': ['vyberove', 'konanie', 'vyber', 'konkurz', 'selection'],
      'kriterium': ['kriteria', 'podmienky', 'poziadavky', 'requirements', 'predpoklady'],
      'publikacia': ['publikacie', 'publikacny', 'vysledky', 'vystup', 'clanok', 'monografia'],
      'citacia': ['citacie', 'citovany', 'ohlas', 'ohlasovost', 'citation'],
      'projekt': ['projekty', 'vyskum', 'grant', 'vega', 'apvv', 'kega'],
      'doktorand': ['doktorandi', 'doktorandsky', 'dizertacia', 'phd', 'skolitel'],
      'katedra': ['katedry', 'pracovisko', 'oddelenie', 'department'],
      'dekan': ['dekana', 'dekanske', 'vedenie', 'fakulta'],
      'ucitel': ['ucitela', 'pedagogicky', 'pedagog', 'vyucba', 'vyucujuci'],
      'zmluva': ['pracovny', 'pomer', 'contract', 'employment', 'obsadenie'],
      'funkcia': ['funkcne', 'miesto', 'pozicia', 'position'],
      'studium': ['studijny', 'program', 'odbor', 'bakalarske', 'magisterske', 'doktorandske'],
      'komisia': ['vyberova', 'rada', 'committee', 'hodnotenie'],
      'ziadost': ['prihlaska', 'application', 'formular', 'dokumenty'],
      'kontakt': ['spojenie', 'informacie', 'udaje', 'email', 'telefon', 'adresa'],
      'termin': ['lehota', 'datum', 'cas', 'deadline', 'faza']
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
      score: r.relevanceScore 
    })));
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
        score += 3; // Bonus za relevantnosť kategórie
      }
    });
    
    // 2. Scoring pre jednotlivé slová
    queryWords.forEach(word => {
      // Kľúčové slová (najvyššia priorita)
      const keywordMatch = normalizedKeywords.some(keyword => 
        keyword.includes(word) || word.includes(keyword) || this.isSimilar(word, keyword)
      );
      if (keywordMatch) {
        score += 7; // Vysoká váha pre keywords
      }
      
      // Názov
      if (normalizedTitle.includes(word)) {
        score += 5;
      }
      
      // Obsah (s TF-IDF boost pre zriedkavé slová)
      if (normalizedContent.includes(word)) {
        const frequency = (normalizedContent.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(frequency * 1.2, 5); // Max 5 body za slovo v obsahu
      }
    });

    // 3. Scoring pre bigramy (2-slovné frázy)
    bigrams.forEach(bigram => {
      if (normalizedContent.includes(bigram) || normalizedTitle.includes(bigram)) {
        score += 6; // Vysoké skóre pre presné frázy
      }
      normalizedKeywords.forEach(keyword => {
        if (keyword.includes(bigram)) {
          score += 8; // Extra vysoké skóre pre bigram v keywords
        }
      });
    });

    // 4. Bonus za presný match celej frázy
    if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
      score += 10; // Vysoký bonus za presný match
    }

    // 5. Bonus za čísla (roky, čísla predpisov, telefónne čísla)
    const numbers = fullQuery.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => {
        if (normalizedContent.includes(num) || item.id.includes(num)) {
          score += 4; // Bonus za zhodu čísel
        }
      });
    }

    // 6. Bonus za ID match (napr. VP_7_2025)
    if (item.id && fullQuery.includes(item.id.toLowerCase())) {
      score += 15; // Veľký bonus za priamy match ID
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
        return contextPart;
      })
      .join('\n\n');
    
    // Kontrola či obsahuje kontaktné informácie
    const hasContactInfo = relevantContent.some(item => 
      item.category === 'Kontakt - výberové konania' || 
      item.keywords.some(kw => ['kontakt', 'email', 'telefon'].includes(kw.toLowerCase()))
    );
    
    // Kontrola či ide o kritériá alebo predpisy
    const isCriteriaRelated = relevantContent.some(item => 
      item.category.includes('Vnútorný predpis') || 
      item.category.includes('Habilitačné a inauguračné konanie')
    );
    
    const contactNote = hasContactInfo 
      ? '\n\nPOZNÁMKA: Pri odpovedaní na otázky o kontaktoch použi presne uvedené kontaktné údaje (email, telefón).'
      : '';
    
    const criteriaNote = isCriteriaRelated
      ? '\n\nPOZNÁMKA: Uvádzaj presné požiadavky a kritériá ako sú uvedené v predpisoch. Pri nejasnostiach odporuč kontaktovanie zodpovednej osoby.'
      : '';
    
    return `PRESNÉ INFORMÁCIE O FILOZOFICKEJ FAKULTE UK (používaj LEN tieto fakty):\n\n${context}\n\nINŠTRUKCIE: Odpovedaj presne podľa týchto informácií z databázy FiF UK. NEPRÍDÁVAJ žiadne vlastné interpretácie alebo detaily, ktoré nie sú explicitne uvedené v kontexte. Pri odkazovaní na vnútorné predpisy uvádzaj ich čísla (napr. VP č. 7/2025).${contactNote}${criteriaNote}`;
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

