let db;
let currentVilla = '';
let cart = [];
let currentCategory = 'drinks';

const defaultInventory = [
    // Drinks
    { name: 'Jägermeister shot', priceCZK: 59, priceEUR: 2.40, category: 'drinks', active: true },
    { name: 'Coca-Cola', priceCZK: 32, priceEUR: 1.30, category: 'drinks', active: true },
    { name: 'Sprite', priceCZK: 32, priceEUR: 1.30, category: 'drinks', active: true },
    { name: 'Fanta', priceCZK: 32, priceEUR: 1.30, category: 'drinks', active: true },
    { name: 'Vitamin Water', priceCZK: 35, priceEUR: 1.40, category: 'drinks', active: true },
    { name: 'Red Bull', priceCZK: 60, priceEUR: 2.40, category: 'drinks', active: true },
    { name: 'Jack & Cola', priceCZK: 125, priceEUR: 5.00, category: 'drinks', active: true },
    { name: 'Gin & Tonic', priceCZK: 75, priceEUR: 3.00, category: 'drinks', active: true },
    { name: 'Moscow Mule', priceCZK: 100, priceEUR: 4.00, category: 'drinks', active: true },
    { name: 'Mojito', priceCZK: 100, priceEUR: 4.00, category: 'drinks', active: true },
    { name: 'Piña Colada', priceCZK: 100, priceEUR: 4.00, category: 'drinks', active: true },
    { name: 'Beer', priceCZK: 60, priceEUR: 2.40, category: 'drinks', active: true },
    { name: 'Prosecco', priceCZK: 475, priceEUR: 19.00, category: 'drinks', active: true },
    // Services
    { name: 'Gas for grill', priceCZK: 510, priceEUR: 20.00, category: 'services', active: true },
    { name: 'Gas for fire table', priceCZK: 306, priceEUR: 12.00, category: 'services', active: true },
    { name: 'City Tax (per person/day)', priceCZK: 50, priceEUR: 2.00, category: 'services', active: true },
    { name: 'Wellness fee', priceCZK: 0, priceEUR: 0, category: 'services', active: true }
];

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('VillaOrdersDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            if (!db.objectStoreNames.contains('inventory')) {
                const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
                inventoryStore.createIndex('category', 'category', { unique: false });
                
                defaultInventory.forEach(item => {
                    inventoryStore.add(item);
                });
            }
            
            if (!db.objectStoreNames.contains('orders')) {
                const ordersStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
                ordersStore.createIndex('villa', 'villa', { unique: false });
                ordersStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

async function getInventory() {
    const transaction = db.transaction(['inventory'], 'readonly');
    const store = transaction.objectStore('inventory');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function selectVilla(villa) {
    currentVilla = villa;
    document.getElementById('villa-name').textContent = villa;
    
    // Smooth transition
    document.getElementById('villa-select').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('villa-select').classList.remove('active');
        document.getElementById('order-screen').classList.add('active');
        showCategory('drinks');
    }, 300);
}

function backToVillas() {
    document.getElementById('order-screen').classList.remove('active');
    document.getElementById('villa-select').classList.add('active');
    cart = [];
    updateCartCount();
}

async function showCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach((tab, index) => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(category)) {
            tab.classList.add('active');
            updateTabIndicator(index);
        }
    });
    
    const container = document.getElementById('items-container');
    const customForm = document.getElementById('custom-form');
    
    if (category === 'custom') {
        container.style.display = 'none';
        customForm.style.display = 'flex';
        customForm.classList.add('fade-in');
        return;
    }
    
    container.style.display = 'block';
    customForm.style.display = 'none';
    
    // Fade out
    container.style.opacity = '0';
    
    setTimeout(async () => {
        container.innerHTML = '';
        
        const inventory = await getInventory();
        const items = category === 'gifts' 
            ? inventory.filter(item => item.active)
            : inventory.filter(item => item.category === category && item.active);
        
        items.forEach((item, index) => {
            const itemCard = createItemCard(item);
            itemCard.style.animationDelay = `${index * 0.05}s`;
            itemCard.classList.add('item-fade-in');
            container.appendChild(itemCard);
        });
        
        // Fade in
        container.style.opacity = '1';
    }, 200);
}

function updateTabIndicator(index) {
    const indicator = document.querySelector('.tab-indicator');
    const tabs = document.querySelectorAll('.tab');
    if (tabs[index]) {
        const tab = tabs[index];
        indicator.style.width = `${tab.offsetWidth}px`;
        indicator.style.left = `${tab.offsetLeft}px`;
    }
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const cartItem = cart.find(ci => ci.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    // Special handling for City Tax
    if (item.name.includes('City Tax')) {
        const persons = cartItem?.persons || 1;
        const nights = cartItem?.nights || 1;
        const totalPrice = item.priceEUR * persons * nights;
        
        card.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.priceEUR} EUR/person/night</div>
                    <div class="city-tax-total">Total: ${totalPrice.toFixed(2)} EUR (${persons} × ${nights} × ${item.priceEUR}€)</div>
                </div>
            </div>
            <div class="item-controls city-tax-controls">
                <div class="city-tax-inputs">
                    <div class="input-group">
                        <label>Persons:</label>
                        <div class="quantity-controls compact">
                            <button onclick="updateCityTaxPersons(${item.id}, ${persons - 1})">-</button>
                            <span class="quantity">${persons}</span>
                            <button onclick="updateCityTaxPersons(${item.id}, ${persons + 1})">+</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Nights:</label>
                        <div class="quantity-controls compact">
                            <button onclick="updateCityTaxNights(${item.id}, ${nights - 1})">-</button>
                            <span class="quantity">${nights}</span>
                            <button onclick="updateCityTaxNights(${item.id}, ${nights + 1})">+</button>
                        </div>
                    </div>
                </div>
                <button class="${quantity > 0 ? 'remove-btn' : 'add-btn'}" 
                        onclick="${quantity > 0 ? `updateQuantity(${item.id}, 0)` : `addCityTax(${item.id})`}">
                    ${quantity > 0 ? 'Remove' : 'Add to Cart'}
                </button>
            </div>
        `;
    } else {
        // Regular items
        card.innerHTML = `
            <div class="item-header">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.priceEUR} EUR / ${item.priceCZK} CZK</div>
                </div>
            </div>
            <div class="item-controls">
                <div class="quantity-controls">
                    <button onclick="updateQuantity(${item.id}, ${quantity - 1}, false)">-</button>
                    <span class="quantity">${quantity}</span>
                    <button onclick="updateQuantity(${item.id}, ${quantity + 1}, true)">+</button>
                </div>
                ${currentCategory === 'gifts' ? '' : `
                    <div class="gift-checkbox">
                        <input type="checkbox" id="gift-${item.id}" ${cartItem?.isGift ? 'checked' : ''} 
                               onchange="toggleGift(${item.id})">
                        <label for="gift-${item.id}">Dárek</label>
                    </div>
                `}
            </div>
        `;
    }
    
    return card;
}

async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 0) return;
    
    const inventory = await getInventory();
    const item = inventory.find(i => i.id === itemId);
    
    const existingIndex = cart.findIndex(ci => ci.id === itemId);
    
    if (newQuantity === 0) {
        if (existingIndex !== -1) {
            cart.splice(existingIndex, 1);
        }
    } else {
        if (existingIndex !== -1) {
            cart[existingIndex].quantity = newQuantity;
        } else {
            cart.push({
                ...item,
                quantity: newQuantity,
                isGift: currentCategory === 'gifts'
            });
        }
    }
    
    updateCartCount();
    showCategory(currentCategory);
}

function toggleGift(itemId) {
    const cartItem = cart.find(ci => ci.id === itemId);
    if (cartItem) {
        cartItem.isGift = document.getElementById(`gift-${itemId}`).checked;
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

function addCustomItem() {
    const name = document.getElementById('custom-name').value;
    const priceCZK = parseFloat(document.getElementById('custom-price-czk').value) || 0;
    const priceEUR = parseFloat(document.getElementById('custom-price-eur').value) || 0;
    const isGift = document.getElementById('custom-gift').checked;
    
    if (!name) return;
    
    const customItem = {
        id: `custom-${Date.now()}`,
        name,
        priceCZK,
        priceEUR,
        category: 'custom',
        quantity: 1,
        isGift
    };
    
    cart.push(customItem);
    updateCartCount();
    
    document.getElementById('custom-name').value = '';
    document.getElementById('custom-price-czk').value = '';
    document.getElementById('custom-price-eur').value = '';
    document.getElementById('custom-gift').checked = false;
}

function showCart() {
    document.getElementById('order-screen').classList.remove('active');
    document.getElementById('cart-screen').classList.add('active');
    displayCartItems();
    calculateTotals();
}

function backToOrder() {
    document.getElementById('cart-screen').classList.remove('active');
    document.getElementById('order-screen').classList.add('active');
}

function displayCartItems() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">
                    ${item.quantity} ks × ${item.priceEUR} EUR
                    ${item.isGift ? '(Dárek / Gift)' : ''}
                </div>
            </div>
            <button onclick="removeFromCart(${index})">Odebrat</button>
        `;
        
        container.appendChild(cartItem);
    });
}

function removeFromCart(index) {
    cart.splice(index, 1);
    displayCartItems();
    calculateTotals();
    updateCartCount();
}

function calculateTotals() {
    const discountPercent = parseFloat(document.getElementById('discount-percent').value) || 0;
    const discountEUR = parseFloat(document.getElementById('discount-eur').value) || 0;
    
    let subtotalEUR = 0;
    let subtotalCZK = 0;
    let giftCount = 0;
    let giftValueEUR = 0;
    
    cart.forEach(item => {
        if (item.isGift) {
            giftCount += item.quantity;
            giftValueEUR += item.quantity * item.priceEUR;
        } else {
            subtotalEUR += item.quantity * item.priceEUR;
            subtotalCZK += item.quantity * item.priceCZK;
        }
    });
    
    let finalDiscountEUR = discountEUR;
    if (discountPercent > 0) {
        finalDiscountEUR = subtotalEUR * (discountPercent / 100);
    }
    
    const totalEUR = Math.max(0, subtotalEUR - finalDiscountEUR);
    const totalCZK = Math.max(0, subtotalCZK - (finalDiscountEUR * 25));
    
    document.getElementById('total-items').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('total-gifts').textContent = `${giftCount} ks / pcs (${giftValueEUR.toFixed(2)} EUR)`;
    document.getElementById('discount-amount').textContent = `${finalDiscountEUR.toFixed(2)} EUR`;
    document.getElementById('total-price').textContent = `${totalEUR.toFixed(2)} EUR / ${Math.round(totalCZK)} CZK`;
}

document.getElementById('discount-percent').addEventListener('input', () => {
    document.getElementById('discount-eur').value = '';
    calculateTotals();
});

document.getElementById('discount-eur').addEventListener('input', () => {
    document.getElementById('discount-percent').value = '';
    calculateTotals();
});

async function processPayment(method) {
    const order = {
        villa: currentVilla,
        date: new Date().toISOString(),
        items: cart,
        payment: method,
        discountPercent: parseFloat(document.getElementById('discount-percent').value) || 0,
        discountEUR: parseFloat(document.getElementById('discount-eur').value) || 0
    };
    
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    await store.add(order);
    
    showReceipt(order);
}

function showReceipt(order) {
    document.getElementById('cart-screen').classList.remove('active');
    document.getElementById('receipt-screen').classList.add('active');
    
    document.getElementById('receipt-villa').textContent = order.villa;
    document.getElementById('receipt-date').textContent = new Date(order.date).toLocaleString('cs-CZ');
    
    const itemsContainer = document.getElementById('receipt-items');
    itemsContainer.innerHTML = '';
    
    let subtotalEUR = 0;
    let subtotalCZK = 0;
    
    order.items.forEach(item => {
        const receiptItem = document.createElement('div');
        receiptItem.className = 'receipt-item';
        
        if (!item.isGift) {
            subtotalEUR += item.quantity * item.priceEUR;
            subtotalCZK += item.quantity * item.priceCZK;
        }
        
        receiptItem.innerHTML = `
            <span>${item.quantity}× ${item.name} ${item.isGift ? '(Gift)' : ''}</span>
            <span>${(item.quantity * item.priceEUR).toFixed(2)} EUR</span>
        `;
        
        itemsContainer.appendChild(receiptItem);
    });
    
    let finalDiscountEUR = order.discountEUR;
    if (order.discountPercent > 0) {
        finalDiscountEUR = subtotalEUR * (order.discountPercent / 100);
    }
    
    const totalEUR = Math.max(0, subtotalEUR - finalDiscountEUR);
    
    document.getElementById('receipt-subtotal').textContent = `${subtotalEUR.toFixed(2)} EUR`;
    
    if (finalDiscountEUR > 0) {
        document.getElementById('receipt-discount-row').style.display = 'flex';
        document.getElementById('receipt-discount').textContent = `-${finalDiscountEUR.toFixed(2)} EUR`;
    } else {
        document.getElementById('receipt-discount-row').style.display = 'none';
    }
    
    document.getElementById('receipt-total').textContent = `${totalEUR.toFixed(2)} EUR`;
    document.getElementById('receipt-payment').textContent = order.payment.toUpperCase();
}

function shareReceipt() {
    const receiptText = document.querySelector('.receipt').innerText;
    
    if (navigator.share) {
        navigator.share({
            title: 'Villa Orders Receipt',
            text: receiptText
        });
    } else {
        navigator.clipboard.writeText(receiptText);
        alert('Účtenka zkopírována / Receipt copied');
    }
}

function downloadPDF() {
    window.print();
}

function newOrder() {
    cart = [];
    updateCartCount();
    document.getElementById('receipt-screen').classList.remove('active');
    document.getElementById('villa-select').classList.add('active');
    
    document.getElementById('discount-percent').value = '';
    document.getElementById('discount-eur').value = '';
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js');
    });
}

initDB();