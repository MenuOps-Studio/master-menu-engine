import { fetchRestaurantData } from './api.js';

// ==========================================
// 1. GLOBAL STATE & CONFIGURATION
// ==========================================
let currentLang = 'el'; 
let menuDataCache = []; 
let ingredientsDataCache = [];
let lastActive = ""; 

// Λίστες για τα Badges & Κατηγορίες (Όπως τα είχατε στο D Brothers)
const chefSignatures = ['Mac & Cheese', 'Truffle', 'Gnocchi vikena', 'D Brothers', 'Tartufata', 'D Brothers Special'];
const seaItems = ['Γαριδομακαρονάδα', 'Salmone', 'Τόνος'];
const veganItems = ['Vegan'];
const bestSellersNames = ['Truffle', 'Tartufata', 'Burrata', 'Gnocchi vikena', 'Mac & Cheese'];
const premiumPizzas = ["Caesar's Pizza", 'Tartufata', 'Prosciutto', 'D Brothers Pizza', 'Italian Margherita', 'Tuna', 'Philadelphia','Gyros Pizza'];
const pastaIngredientsList = ['Λινγκουίνι','Πέννες'];

// Βοηθητική συνάρτηση για τα υλικά
function normalizeText(text) {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ==========================================
// 2. ENGINE INITIALIZATION
// ==========================================
export async function initEngine() {
    // Εκθέτουμε την αλλαγή γλώσσας στο window για να δουλεύουν τα κουμπιά του HTML
    window.changeLanguage = changeLanguage;
    
    // Φτιάχνουμε δυναμικά το "σασί" του μενού (Τα sections)
    buildPageStructure();
    
    // Αρχικό τράβηγμα δεδομένων
    await updateMenuLoop();
    
    // Αυτόματη ανανέωση κάθε 3 δευτερόλεπτα!
    setInterval(updateMenuLoop, 3000);
    
    // Ενεργοποίηση Scroll Spy (για το Navbar)
    window.addEventListener('scroll', updateActiveScroll, { passive: true });
    setTimeout(updateActiveScroll, 100); 
}

async function updateMenuLoop() {
    const { menuData, ingredientsData, config } = await fetchRestaurantData();
    
    // --- 1. ΕΦΑΡΜΟΓΗ CONFIG (Λογότυπο & Χρώματα) ---
    if (config) {
       // Τραβάμε το site_name και φτιάχνουμε τον υπότιτλο
        if (config.site_name) {
            // Αν έχεις βάλει "site_subtitle" στο Supabase το παίρνει, αλλιώς βάζει "Italian Restaurant"
            let subtitle = config.site_subtitle ? config.site_subtitle : "Italian Restaurant";
            
            // Ενώνουμε το δυναμικό όνομα με τον πλάγιο υπότιτλο (όπως ήταν στο original design)
            document.getElementById('restaurant-name').innerHTML = `${config.site_name}<br><em>${subtitle}</em>`;
            
            // Αλλάζει και τον τίτλο στην καρτέλα του browser!
            document.title = config.site_name + " | Menu"; 
        }
        
        // Τραβάμε το logo_url
        const logoEl = document.getElementById('logo');
        if (config.logo_url) { 
            logoEl.src = config.logo_url;
            logoEl.style.display = 'block';
        }
        
        // --- ΕΦΑΡΜΟΓΗ ΧΡΩΜΑΤΩΝ ΑΠΟ ΤΟ CONFIG ---
        
        // 1. Backgrounds & Panels
        if (config.color_cream) document.documentElement.style.setProperty('--cream', config.color_cream);
        if (config.color_parchment) document.documentElement.style.setProperty('--parchment', config.color_parchment);
        
        // 2. Βασικά Χρώματα (Κείμενα, Headers, Κουμπιά)
        if (config.primary_color) document.documentElement.style.setProperty('--espresso', config.primary_color);
        if (config.secondary_color) {
            document.documentElement.style.setProperty('--gold', config.secondary_color);
            // Τα borders παίρνουν το secondary χρώμα και τους βάζουμε διαφάνεια (8C = 55%, 40 = 25%)
            document.documentElement.style.setProperty('--border-strong', config.secondary_color + '8C'); 
            document.documentElement.style.setProperty('--border', config.secondary_color + '40'); 
        }
        
        // 3. Δευτερεύοντα / Badges / Λεπτομέρειες
        if (config.color_sienna) document.documentElement.style.setProperty('--sienna', config.color_sienna);
        if (config.color_gold_light) document.documentElement.style.setProperty('--gold-light', config.color_gold_light);
        if (config.color_sage) document.documentElement.style.setProperty('--sage', config.color_sage);
        if (config.color_muted) document.documentElement.style.setProperty('--muted', config.color_muted);
    }

    // --- 2. ΕΦΑΡΜΟΓΗ MENU & INGREDIENTS ---
    if (JSON.stringify(menuData) !== JSON.stringify(menuDataCache) || 
        JSON.stringify(ingredientsData) !== JSON.stringify(ingredientsDataCache)) {
        
        menuDataCache = menuData;
        ingredientsDataCache = ingredientsData;
        renderMenu(menuData, ingredientsData);
    }
}   

// ==========================================
// 3. ΔΗΜΙΟΥΡΓΙΑ DOM (Χτίζουμε τα Sections)
// ==========================================
function buildPageStructure() {
    // 1. Φτιάχνουμε το Navbar
    document.getElementById('nav-strip').innerHTML = `
        <a class="nav-pill" href="#antipasti" data-el="Ορεκτικά" data-en="Starters" data-bg="Предястия">Ορεκτικά</a>
        <a class="nav-pill" href="#salads" data-el="Σαλάτες" data-en="Salads" data-bg="Салати">Σαλάτες</a>
        <a class="nav-pill" href="#pasta" data-el="Ζυμαρικά" data-en="Pasta" data-bg="Паста">Ζυμαρικά</a>
        <a class="nav-pill" href="#gnocchi" data-el="Gnocchi" data-en="Gnocchi" data-bg="Ньоки">Gnocchi</a>
        <a class="nav-pill" href="#pizza" data-el="Πίτσες" data-en="Pizza" data-bg="Пица">Πίτσες</a>
        <a class="nav-pill" href="#drinks" data-el="Αναψυκτικά" data-en="Drinks" data-bg="Напитки">Αναψυκτικά</a>
    `;

    // 2. Φτιάχνουμε τον κορμό (SVGs, Taglines, Grids)
    document.getElementById('app').innerHTML = `
        <div class="bestsellers-block">
            <p class="bs-label" data-el="★ Οι Αγαπημένες μας Επιλογές" data-en="★ Our Favorite Choices" data-bg="★ Нашите любими избори">★ Οι Αγαπημένες μας Επιλογές</p>
            <h2 class="bs-title"><span data-el="Οι Σπεσιαλιτέ του" data-en="Chef's" data-bg="Специалитети на">Οι Σπεσιαλιτέ του</span> <em><span data-el="Σεφ" data-en="Signatures" data-bg="Шефа">Σεφ</span></em></h2>
            <div class="bs-items" id="bs-items-container"></div>
        </div>

        <section class="section" id="antipasti">
            <div class="section-header">
                <div class="section-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg></div>
                <h2 class="section-title" data-el="Ορεκτικά" data-en="Starters" data-bg="Предястия">Ορεκτικά</h2>
            </div>
            <p class="section-tagline" data-el="Per iniziare — Για να ξεκινήσει όμορφα το τραπέζι" data-en="Per iniziare — To start the table beautifully">Per iniziare — Για να ξεκινήσει όμορφα το τραπέζι</p>
            <div class="section-rule"></div>
            <div id="antipasti-container" class="menu-grid"></div>
        </section>

        <section class="section" id="salads">
            <div class="section-header">
                <div class="section-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 11.5s1.75-2 6-2.5S17 8 17 8z"/></svg></div>
                <h2 class="section-title" data-el="Σαλάτες" data-en="Salads" data-bg="Салати">Σαλάτες</h2>
            </div>
            <p class="section-tagline" data-el="Fresche e genuine — Φρεσκάδα σε κάθε μπουκιά" data-en="Fresche e genuine — Freshness in every bite">Fresche e genuine — Φρεσκάδα σε κάθε μπουκιά</p>
            <div class="section-rule"></div>
            <div id="salads-container" class="menu-grid"></div>
        </section>

        <section class="section" id="pasta">
            <div class="section-header">
                <div class="section-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 17h20v1.5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5V17z"/><path d="M3.5 15.5C3.5 11 7.3 7.5 12 7.5s8.5 3.5 8.5 8H3.5z"/><path d="M9 6h1.5v-4H9v4zm4.5-1h1.5v-4h-1.5v4z"/></svg></div>
                <h2 class="section-title" data-el="Ζυμαρικά" data-en="Pasta" data-bg="Паста">Ζυμαρικά</h2>
            </div>
            <p class="section-tagline" data-el="Il gusto autentico dell'Italia — Η αυθεντική γεύση της Ιταλίας" data-en="Il gusto autentico dell'Italia — The authentic taste of Italy">Il gusto autentico dell'Italia — Η αυθεντική γεύση της Ιταλίας</p>
            <div class="section-rule"></div>
            <div id="pasta-container" class="menu-grid"></div>
        </section>

        <div id="pasta-types-container" class="section" style="padding: 40px 24px 20px; text-align: center; display: none;">
            <div style="font-family: 'EB Garamond', serif; font-size: 16px; color: var(--muted); margin-bottom: 8px;" data-el="Διαθέσιμα ζυμαρικά:" data-en="Available pasta:">Διαθέσιμα ζυμαρικά:</div>
            <div id="pasta-list" style="font-family: 'EB Garamond', serif; font-size: 20px; color: var(--gold); letter-spacing: 0.03em;"></div>
        </div>

        <section class="section" id="gnocchi">
            <div class="section-header">
                <div class="section-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>
                <h2 class="section-title" data-el="Gnocchi" data-en="Gnocchi" data-bg="Ньоки">Gnocchi</h2>
            </div>
            <p class="section-tagline" data-el="Morbide tentazioni — Απαλοί πειρασμοί" data-en="Morbide tentazioni — Soft temptations">Morbide tentazioni — Απαλοί πειρασμοί</p>
            <div class="section-rule"></div>
            <div id="gnocchi-container" class="menu-grid"></div>
        </section>

        <section class="section" id="pizza">
            <div class="section-header">
                <div class="section-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.43 2 5.23 3.54 3.01 6L12 22l8.99-16C18.78 3.55 15.57 2 12 2zM7 7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg></div>
                <h2 class="section-title" data-el="Πίτσες" data-en="Pizza" data-bg="Пица">Πίτσες</h2>
            </div>
            <p class="section-tagline" data-el="Dall'impasto al cuore — Από το ζυμάρι... στην καρδιά σας" data-en="Dall'impasto al cuore — From the dough... to your heart">Dall'impasto al cuore — Από το ζυμάρι... στην καρδιά σας</p>
            <div class="section-rule"></div>
            <div id="pizza-container" class="menu-grid"></div>
        </section>

        <section class="section" id="drinks">
            <div class="section-header">
                <div class="section-icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 2v4h2V2h-2zM4 6v2h16V6H4zm1.8 2l1.3 12.4c.1.9 1 1.6 2 1.6h5.8c1 0 1.9-.7 2-1.6L18.2 8H5.8z"/></svg></div>
                <h2 class="section-title" data-el="Αναψυκτικά" data-en="Beverages" data-bg="Напитки">Αναψυκτικά</h2>
            </div>
            <p class="section-tagline" data-el="Rinfrescanti momenti — Μια ανάσα δροσιάς" data-en="Rinfrescanti momenti — Refreshing moments">Rinfrescanti momenti — Μια ανάσα δροσιάς</p>
            <div class="section-rule"></div>
            <div class="drinks-grid" id="drinks-container"></div>
        </section>
    `;
}

// ==========================================
// 4. RENDER ΔΕΔΟΜΕΝΩΝ 
// ==========================================
function renderMenu(menuData, ingredientsData) {
    const containers = {
        bs: document.getElementById('bs-items-container'),
        antipasti: document.getElementById('antipasti-container'),
        salads: document.getElementById('salads-container'),
        pasta: document.getElementById('pasta-container'),
        gnocchi: document.getElementById('gnocchi-container'),
        pizza: document.getElementById('pizza-container'),
        drinks: document.getElementById('drinks-container')
    };

    // Καθαρισμός
    Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

    let premiumPizzaHtml = '';
    let standardPizzaHtml = '';

    menuData.forEach(item => {
        if (item.status === 'HIDDEN') return; 

        // Γλώσσες
        let displayName = currentLang === 'el' ? (item.name_el || item.name) : currentLang === 'en' ? (item.name_en || item.name) : (item.name_bg || item.name);
        let displayDesc = currentLang === 'el' ? (item.description_el || item.description || '') : currentLang === 'en' ? (item.description_en || item.description || '') : (item.description_bg || item.description || '');
        const price = Number(item.price).toFixed(2).replace('.', ',');

        // Διαθεσιμότητα
        let opacity = "1", pointer = "auto", textDeco = "none", statusBadgeHtml = "";
        const isUnavailable = item.status !== "AVAILABLE";

        if (isUnavailable) {
            opacity = "0.4"; pointer = "none"; textDeco = "line-through";
            let label = 'ΜΗ ΔΙΑΘΕΣΙΜΟ';
            if (item.status === "UNAVAILABLE_TODAY") {
                if(currentLang === 'el') label = 'ΕΞΑΝΤΛΗΘΗΚΕ';
                else if(currentLang === 'en') label = 'SOLD OUT';
                else if(currentLang === 'bg') label = 'ИЗЧЕРПАНО';
            } else {
                if(currentLang === 'en') label = 'UNAVAILABLE';
                else if(currentLang === 'bg') label = 'НЕЕ НАЛИЧНО';
            }
            statusBadgeHtml = `<span class="item-badge" style="background: #8B3A1C; color: #FFF; border: none;">${label}</span>`;
        }

        // Badges (Chef, Vegan, Sea)
        let customBadgeHtml = '';
        if (chefSignatures.includes(item.name)) {
            let badgeLabel = currentLang === 'bg' ? 'Специалитет' : 'Signature';
            customBadgeHtml = `<span class="item-badge badge-chef">${badgeLabel}</span>`;
        } else if (seaItems.includes(item.name)) {
            let badgeLabel = currentLang === 'bg' ? 'Море' : 'Sea';
            customBadgeHtml = `<span class="item-badge badge-premium">${badgeLabel}</span>`;
        } else if (veganItems.includes(item.name)) {
            let badgeLabel = currentLang === 'bg' ? 'Веган' : 'Vegan';
            customBadgeHtml = `<span class="item-badge badge-vegan">${badgeLabel}</span>`;
        }
        const allBadges = `${customBadgeHtml} ${statusBadgeHtml}`;

        // Ελλείψεις Υλικών
        let missingIngredientsHtml = '';
        if (!isUnavailable) {
            let missingIngredients = [];
            let productIngs = [];
            if (typeof item.ingredients === 'string') {
                try { productIngs = JSON.parse(item.ingredients); } catch(e) {}
            } else if (Array.isArray(item.ingredients)) {
                productIngs = item.ingredients;
            }

            if (productIngs.length > 0 && ingredientsData && ingredientsData.length > 0) {
                productIngs.forEach(ingName => {
                    const globalIng = ingredientsData.find(i => normalizeText(i.name).trim() === normalizeText(ingName).trim());
                    if (globalIng && globalIng.status !== 'AVAILABLE') {
                        let translatedIngName = currentLang === 'en' ? (globalIng.name_en || globalIng.name) : currentLang === 'bg' ? (globalIng.name_bg || globalIng.name) : globalIng.name;
                        missingIngredients.push(translatedIngName);
                    }
                });
            }

            if (missingIngredients.length > 0) {
                let withoutLabel = currentLang === 'en' ? 'Without:' : currentLang === 'bg' ? 'Без:' : 'Χωρίς:';
                missingIngredientsHtml = `<div style="font-size: 11.5px; color: #8B3A1C; font-weight: 500; margin-top: 4px; font-style: italic;">⚠️ ${withoutLabel} ${missingIngredients.join(', ')}</div>`;
            }
        }

        // --- ΧΤΙΣΙΜΟ ΤΟΥ HTML ΓΙΑ ΤΟ ΠΙΑΤΟ ---
        let itemHtml = `
            <div class="item" style="opacity: ${opacity}; pointer-events: ${pointer};">
                <div>
                    <div class="item-name">${displayName} ${allBadges}</div>
                    ${displayDesc ? `<div class="item-desc">${displayDesc}</div>` : ''}
                    ${missingIngredientsHtml}
                </div>
                <div class="item-price" style="text-decoration: ${textDeco};"> ${price}€</div>
            </div>
        `;

        // Best Sellers Check
        if (bestSellersNames.includes(item.name) && containers.bs) {
            let bsBadge = statusBadgeHtml ? `<span class="item-badge" style="background: #8B3A1C; color: #FFF; font-size: 9px; padding: 2px 5px;">${statusBadgeHtml.replace(/<[^>]*>?/gm, '')}</span>` : '';
            containers.bs.innerHTML += `
                <div class="bs-item" style="opacity: ${opacity}; pointer-events: ${pointer};">
                    <div>
                        <div class="bs-item-name">${displayName} ${bsBadge}</div>
                        ${displayDesc ? `<div class="bs-item-desc">${displayDesc}</div>` : ''}
                        ${missingIngredientsHtml}
                    </div>
                    <div class="bs-item-price" style="text-decoration: ${textDeco};"> ${price}€</div>
                </div>
            `;
        }

        // Κατανομή στις κατηγορίες
        if (item.category === 'Ορεκτικά' && containers.antipasti) containers.antipasti.innerHTML += itemHtml;
        else if (item.category === 'Σαλάτες' && containers.salads) containers.salads.innerHTML += itemHtml;
        else if (item.category === 'Ζυμαρικά' && containers.pasta) containers.pasta.innerHTML += itemHtml;
        else if (item.category === 'Gnocchi' && containers.gnocchi) containers.gnocchi.innerHTML += itemHtml;
        else if (item.category === 'Πίτσες' && containers.pizza) {
            if (premiumPizzas.some(pizza => pizza.toLowerCase() === item.name.trim().toLowerCase())) premiumPizzaHtml += itemHtml;
            else standardPizzaHtml += itemHtml;
        } else if (item.category === 'Αναψυκτικά' && containers.drinks) {
            let drinkBadge = statusBadgeHtml ? `<span class="item-badge" style="background: #8B3A1C; color: #FFF; border: none; font-size: 8px; padding: 2px 5px; margin-left: 6px;">${statusBadgeHtml.replace(/<[^>]*>?/gm, '')}</span>` : '';
            containers.drinks.innerHTML += `
                <div class="drink-cell" style="opacity: ${opacity}; pointer-events: ${pointer};">
                    <div class="drink-cell-name">${displayName} ${drinkBadge}</div>
                    <div class="drink-cell-price" style="text-decoration: ${textDeco};">${price}€</div>
                </div>
            `;
        }
    });

    // Οργάνωση Πίτσας
    if (containers.pizza) {
        let pizzaWord = currentLang === 'en' ? "Pizzas" : currentLang === 'bg' ? "Пици" : "Πίτσες"; 
        let classicHeaderHtml = standardPizzaHtml ? `<div class="subsection-title" style="margin-top: 10px;">Classic ${pizzaWord}</div>` : '';
        let premiumHeaderHtml = premiumPizzaHtml ? `<div class="subsection-title" style="margin-top: 20px;">Premium ${pizzaWord}</div>` : '';
        containers.pizza.innerHTML = classicHeaderHtml + standardPizzaHtml + premiumHeaderHtml + premiumPizzaHtml;
    }
    
    updatePastaList();
}

// ==========================================
// 5. UPDATE PASTA & LANGUAGES
// ==========================================
function updatePastaList() {
    const pastaListEl = document.getElementById('pasta-list');
    const pastaContainerEl = document.getElementById('pasta-types-container');
    
    if (!pastaListEl || !ingredientsDataCache) return;

    const availablePasta = ingredientsDataCache.filter(ing => 
        pastaIngredientsList.includes(ing.name) && ing.status === 'AVAILABLE'
    );

    if (availablePasta.length > 0) {
        pastaListEl.setAttribute('data-el', availablePasta.map(i => i.name).join(' • '));
        pastaListEl.setAttribute('data-en', availablePasta.map(i => i.name_en || i.name).join(' • '));
        pastaListEl.setAttribute('data-bg', availablePasta.map(i => i.name_bg || i.name).join(' • '));

        pastaListEl.innerText = pastaListEl.getAttribute(`data-${currentLang}`);
        pastaContainerEl.style.display = 'block';
    } else {
        pastaContainerEl.style.display = 'none';
    }
}

function changeLanguage(lang) {
    currentLang = lang;

    document.querySelectorAll('[data-el]').forEach(el => {
        const translatedText = el.getAttribute(`data-${lang}`);
        if (el.id !== 'pasta-list' && translatedText && el.childNodes.length > 0 && el.childNodes[0].nodeType === 3) {
            el.childNodes[0].nodeValue = translatedText + " ";
        }
    });

    const buttons = document.querySelectorAll('.lang-switcher button');
    buttons.forEach(btn => {
        const langAttr = btn.getAttribute('onclick');
        btn.style.opacity = langAttr.includes(`'${lang}'`) ? "1" : "0.5";
    });

    if (menuDataCache.length > 0) {
        renderMenu(menuDataCache, ingredientsDataCache);
    }
}

// ==========================================
// 6. SCROLL NAVIGATION LOGIC
// ==========================================
function updateActiveScroll() {
    const pills = document.querySelectorAll('.nav-pill');
    const sections = ['antipasti','salads','pasta','gnocchi','pizza','drinks'];
    let current = ""; 
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) {
            current = id;
        }
    });
    
    pills.forEach(p => {
        const isActive = current !== "" && p.getAttribute('href') === '#' + current;
        p.classList.toggle('active', isActive);
        
        if (isActive && current !== lastActive) {
            const nav = p.closest('.nav-strip');
            if (nav) {
                const pillLeft = p.offsetLeft;
                const pillWidth = p.offsetWidth;
                const navWidth = nav.offsetWidth;
                setTimeout(() => {
                    nav.scrollTo({ left: pillLeft - (navWidth / 2) + (pillWidth / 2), behavior: 'smooth' });
                }, 50);
            }
        }
    });
    lastActive = current;
}