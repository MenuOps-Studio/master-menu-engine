export function renderNav(container, categories) {
    container.innerHTML = categories.map(cat => `
        <a class="nav-pill" id="pill-${cat.toLowerCase().replace(/\s/g, '-')}" 
           href="#${cat.toLowerCase().replace(/\s/g, '-')}">${cat}</a>
    `).join('');
}

export function updateActiveNav(activeId) {
    document.querySelectorAll('.nav-pill').forEach(pill => pill.classList.remove('active'));
    const activePill = document.getElementById(`pill-${activeId}`);
    if (activePill) {
        activePill.classList.add('active');
        activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

export function renderMenu(container, menuData) {
    const grouped = menuData.reduce((acc, item) => {
        const cat = item.category || 'Γενικά';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    container.innerHTML = Object.entries(grouped).map(([category, items]) => `
        <section id="${category.toLowerCase().replace(/\s/g, '-')}" class="menu-section">
            <h2 class="section-title">${category}</h2>
            <div class="menu-grid">
                ${items.map(item => `
                    <div class="menu-item">
                        <div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-desc">${item.description || ''}</div>
                        </div>
                        <div class="item-price">${item.price ? item.price + '€' : ''}</div>
                    </div>
                `).join('')}
            </div>
        </section>
    `).join('');
}