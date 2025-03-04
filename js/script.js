let allProducts = [];
if (categories.length > 0) {
    allProducts = categories.reduce((acc, category) => {
        return acc.concat(category.products);
    }, []);
}



    // Complete product data structure
    const categories = [
        {
            name: "Potato Chips",
            icon: "🥔",
            products: [
                { id: 101, name: "Sea Salt Crisps", price: 2.99, image: "images/chips1.jpg" },
                { id: 102, name: "BBQ Flavor", price: 3.29, image: "images/chips2.jpg" },
                { id: 103, name: "Sour Cream & Onion", price: 2.99, image: "images/chips3.jpg" },
                { id: 104, name: "Salt & Vinegar", price: 3.49, image: "images/chips4.jpg" },
                { id: 105, name: "Jalapeño", price: 3.29, image: "images/chips5.jpg" },
                { id: 106, name: "Honey Mustard", price: 3.49, image: "images/chips6.jpg" },
                { id: 107, name: "Cheddar Cheese", price: 3.29, image: "images/chips7.jpg" },
                { id: 108, name: "Salt & Pepper", price: 2.99, image: "images/chips8.jpg" },
                { id: 109, name: "Sweet Chili", price: 3.49, image: "images/chips9.jpg" },
                { id: 110, name: "Original Recipe", price: 2.79, image: "images/chips10.jpg" }
            ]
        },
        {
            name: "Chocolate Bars",
            icon: "🍫",
            products: [
                { id: 201, name: "70% Dark Chocolate", price: 3.49, image: "images/chocolate1.jpg" },
                { id: 202, name: "Milk Chocolate", price: 3.29, image: "images/chocolate2.jpg" },
                { id: 203, name: "Almond Crunch", price: 3.99, image: "images/chocolate3.jpg" },
                { id: 204, name: "Caramel Swirl", price: 4.29, image: "images/chocolate4.jpg" },
                { id: 205, name: "White Chocolate", price: 3.79, image: "images/chocolate5.jpg" },
                { id: 206, name: "Peanut Butter", price: 4.09, image: "images/chocolate6.jpg" },
                { id: 207, name: "Mint Fusion", price: 3.89, image: "images/chocolate7.jpg" },
                { id: 208, name: "Hazelnut Dream", price: 4.49, image: "images/chocolate8.jpg" },
                { id: 209, name: "Orange Zest", price: 3.99, image: "images/chocolate9.jpg" },
                { id: 210, name: "Ruby Chocolate", price: 4.79, image: "images/chocolate10.jpg" }
            ]
        },

        {
            name: "Energy Drinks",
            icon: "⚡",
            products: [
                { id: 301, name: "Turbo Charge", price: 3.99, image: "images/energy1.jpg" },
                { id: 302, name: "Power Punch", price: 3.99, image: "images/energy2.jpg" },
                { id: 303, name: "Electro Boost", price: 3.99, image: "images/energy3.jpg" },
                { id: 304, name: "Zip Zap", price: 3.99, image: "images/energy4.jpg" },
                { id: 305, name: "Mega Volt", price: 3.99, image: "images/energy5.jpg" },
                { id: 306, name: "Atomic Zing", price: 3.99, image: "images/energy6.jpg" },
                { id: 307, name: "Rapid Revive", price: 3.99, image: "images/energy7.jpg" },
                { id: 308, name: "Hyper Surge", price: 3.99, image: "images/energy5.jpg" },
                { id: 309, name: "Quick Burst", price: 3.99, image: "images/energy3.jpg" },
                { id: 310, name: "Energy Blast", price: 3.99, image: "images/energy4.jpg" }
            ]
        },
        {
            name: "Cookies",
            icon: "🍪",
            products: [
                { id: 401, name: "Classic Chocolate Chip", price: 4.99, image: "images/cookie1.jpg" },
                { id: 402, name: "Oatmeal Raisin", price: 4.99, image: "images/cookie2.jpg" },
                { id: 403, name: "Peanut Butter Delight", price: 4.99, image: "images/cookie3.jpg" },
                { id: 404, name: "Sugar Sprinkle", price: 4.99, image: "images/cookie4.jpg" },
                { id: 405, name: "Double Chocolate", price: 4.99, image: "images/cookie5.jpg" },
                { id: 406, name: "Macadamia Nut", price: 4.99, image: "images/cookie6.jpg" },
                { id: 407, name: "Snickerdoodle", price: 4.99, image: "images/cookie7.jpg" },
                { id: 408, name: "Ginger Snap", price: 4.99, image: "images/cookie8.jpg" },
                { id: 409, name: "Lemon Zest", price: 4.99, image: "images/cookie9.jpg" },
                { id: 410, name: "White Chocolate Cranberry", price: 4.99, image: "images/cookie10.jpg" }
            ]
        },

        {
        name: "Nuts & Trail Mix",
        icon: "🥜",
        products: [
            { id: 501, name: "Mountain Trail Mix", price: 5.99, image: "images/nuts1.jpg" },
            { id: 502, name: "Premium Nut Mix", price: 6.49, image: "images/nuts2.jpg" },
            { id: 503, name: "Deluxe Trail Mix", price: 6.99, image: "images/nuts3.jpg" },
            { id: 504, name: "Classic Nut Mix", price: 5.99, image: "images/nuts4.jpg" },
            { id: 505, name: "Tropical Trail Mix", price: 6.99, image: "images/nuts5.jpg" },
            { id: 506, name: "Spicy Nut Mix", price: 6.49, image: "images/nuts6.jpg" },
            { id: 507, name: "Fruit & Nut Mix", price: 6.99, image: "images/nuts7.jpg" },
            { id: 508, name: "Energy Trail Mix", price: 7.49, image: "images/nuts8.jpg" },
            { id: 509, name: "Cranberry Nut Mix", price: 6.99, image: "images/nuts9.jpg" },
            { id: 510, name: "Peanut Butter Trail Mix", price: 7.99, image: "images/nuts10.jpg" }
        ]
        },
    ];

    // Cart functionality
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize allProducts
        allProducts = categories.reduce((acc, category) => {
            return acc.concat(category.products);
        }, []);
    
        // Only generate categories if product container exists
        const productContainer = document.getElementById('product-container');
        if (productContainer) {
            categories.forEach(category => {
                productContainer.appendChild(createCategorySection(category));
            });
        }

        
    function addToCart(productId) {
        // Find the product in categories
        let product;
        for (const category of categories) {
            product = category.products.find(p => p.id === productId);
            if (product) break;
        }

        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        updateCartCount();
        saveCart();
        showAddedToast(product.name);
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn add-to-cart" data-product-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `;
        return card;
    }

    function createCategorySection(category) {
        const section = document.createElement('section');
        section.className = 'category';
        section.innerHTML = `<h2 class="category-title">${category.icon} ${category.name}</h2>`;
        
        const productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        
        for (let i = 0; i < category.products.length; i += 10) {
            const productRow = document.createElement('div');
            productRow.className = 'products-row';
            const chunk = category.products.slice(i, i + 10);
            chunk.forEach(product => {
                productRow.appendChild(createProductCard(product));
            });
            productsContainer.appendChild(productRow);
        }
        
        section.appendChild(productsContainer);
        return section;
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
    }

    function showAddedToast(productName) {
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${productName} added to cart!`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Initialize everything when DOM loads

        
        updateCartCount();
    });














