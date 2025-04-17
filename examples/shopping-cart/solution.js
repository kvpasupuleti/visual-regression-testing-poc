// This file contains the solution code for a shopping cart assessment

export const solutionHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shopping Cart</title>
</head>
<body>
  <div class="container">
    <h1>Shopping Cart</h1>
    
    <div class="products-container">
      <h2>Products</h2>
      <div class="products-grid">
        <div class="product-card" data-id="1">
          <img src="https://via.placeholder.com/150" alt="Product 1">
          <h3>Product 1</h3>
          <p class="price">$19.99</p>
          <button class="add-to-cart-btn">Add to Cart</button>
        </div>
        <div class="product-card" data-id="2">
          <img src="https://via.placeholder.com/150" alt="Product 2">
          <h3>Product 2</h3>
          <p class="price">$24.99</p>
          <button class="add-to-cart-btn">Add to Cart</button>
        </div>
        <div class="product-card" data-id="3">
          <img src="https://via.placeholder.com/150" alt="Product 3">
          <h3>Product 3</h3>
          <p class="price">$14.99</p>
          <button class="add-to-cart-btn">Add to Cart</button>
        </div>
        <div class="product-card" data-id="4">
          <img src="https://via.placeholder.com/150" alt="Product 4">
          <h3>Product 4</h3>
          <p class="price">$29.99</p>
          <button class="add-to-cart-btn">Add to Cart</button>
        </div>
      </div>
    </div>
    
    <div class="cart-container">
      <h2>Cart</h2>
      <div id="cart-items">
        <!-- Cart items will be added here dynamically -->
      </div>
      <div class="cart-summary">
        <div class="total">
          <span>Total:</span>
          <span id="cart-total">$0.00</span>
        </div>
        <button id="checkout-btn" disabled>Checkout</button>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const solutionCSS = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1, h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

h1 {
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
  margin-bottom: 30px;
}

.products-container {
  margin-bottom: 40px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.product-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.product-card h3, .product-card p {
  padding: 0 15px;
  margin: 10px 0;
}

.price {
  font-weight: bold;
  color: #e74c3c;
}

.add-to-cart-btn {
  width: 100%;
  padding: 10px;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.add-to-cart-btn:hover {
  background-color: #2980b9;
}

.cart-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.cart-item-info {
  display: flex;
  align-items: center;
}

.cart-item img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  margin-right: 15px;
  border-radius: 4px;
}

.quantity-controls {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.quantity {
  width: 40px;
  height: 30px;
  text-align: center;
  border: 1px solid #ddd;
  margin: 0 5px;
}

.remove-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.cart-summary {
  margin-top: 20px;
  text-align: right;
}

.total {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

#checkout-btn {
  padding: 10px 20px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

#checkout-btn:hover:not([disabled]) {
  background-color: #27ae60;
}

#checkout-btn[disabled] {
  background-color: #95a5a6;
  cursor: not-allowed;
}
`;

export const solutionJS = `
document.addEventListener('DOMContentLoaded', function() {
  // Product data
  const products = [
    { id: 1, name: 'Product 1', price: 19.99, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Product 2', price: 24.99, image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Product 3', price: 14.99, image: 'https://via.placeholder.com/150' },
    { id: 4, name: 'Product 4', price: 29.99, image: 'https://via.placeholder.com/150' }
  ];
  
  // Cart state
  let cart = [];
  
  // DOM elements
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalElement = document.getElementById('cart-total');
  const checkoutButton = document.getElementById('checkout-btn');
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  
  // Add to cart button event listeners
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productId = parseInt(productCard.dataset.id);
      addToCart(productId);
    });
  });
  
  // Add to cart function
  function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    updateCart();
  }
  
  // Update quantity function
  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      cart = cart.filter(item => item.id !== productId);
    } else {
      const item = cart.find(item => item.id === productId);
      if (item) {
        item.quantity = newQuantity;
      }
    }
    
    updateCart();
  }
  
  // Remove from cart function
  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
  }
  
  // Update cart display
  function updateCart() {
    // Clear cart items container
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
      checkoutButton.disabled = true;
    } else {
      checkoutButton.disabled = false;
      
      // Add each cart item to display
      cart.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        
        cartItemElement.innerHTML = \`
          <div class="cart-item-info">
            <img src="\${item.image}" alt="\${item.name}">
            <div>
              <h4>\${item.name}</h4>
              <p>$\${item.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="quantity-controls">
            <button class="quantity-btn decrease">-</button>
            <input type="number" class="quantity" value="\${item.quantity}" min="1" max="10">
            <button class="quantity-btn increase">+</button>
            <button class="remove-btn">Remove</button>
          </div>
        \`;
        
        cartItemsContainer.appendChild(cartItemElement);
        
        // Add event listeners to quantity controls
        const decreaseBtn = cartItemElement.querySelector('.decrease');
        const increaseBtn = cartItemElement.querySelector('.increase');
        const quantityInput = cartItemElement.querySelector('.quantity');
        const removeBtn = cartItemElement.querySelector('.remove-btn');
        
        decreaseBtn.addEventListener('click', () => {
          updateQuantity(item.id, item.quantity - 1);
        });
        
        increaseBtn.addEventListener('click', () => {
          updateQuantity(item.id, item.quantity + 1);
        });
        
        quantityInput.addEventListener('change', () => {
          const newQuantity = parseInt(quantityInput.value) || 0;
          updateQuantity(item.id, newQuantity);
        });
        
        removeBtn.addEventListener('click', () => {
          removeFromCart(item.id);
        });
      });
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = \`$\${total.toFixed(2)}\`;
  }
  
  // Initialize cart display
  updateCart();
  
  // Checkout button event listener
  checkoutButton.addEventListener('click', function() {
    if (cart.length > 0) {
      alert('Thank you for your purchase!');
      cart = [];
      updateCart();
    }
  });
});
`;

// E2E testing scenarios for shopping cart
export const testScenarios = [
  {
    name: "Add product to cart",
    steps: [
      { type: "click", selector: ".product-card[data-id='1'] .add-to-cart-btn" },
      { type: "check", selector: "#cart-items", expectItems: 1 }
    ]
  },
  {
    name: "Increase product quantity",
    steps: [
      { type: "click", selector: ".product-card[data-id='2'] .add-to-cart-btn" },
      { type: "click", selector: ".quantity-controls .increase" },
      { type: "check", selector: ".quantity", expectValue: "2" }
    ]
  },
  {
    name: "Remove product from cart",
    steps: [
      { type: "click", selector: ".product-card[data-id='3'] .add-to-cart-btn" },
      { type: "click", selector: ".remove-btn" },
      { type: "check", selector: "#cart-items", expectText: "Your cart is empty" }
    ]
  },
  {
    name: "Checkout process",
    steps: [
      { type: "click", selector: ".product-card[data-id='4'] .add-to-cart-btn" },
      { type: "click", selector: "#checkout-btn" },
      { type: "check", selector: "#cart-items", expectText: "Your cart is empty" }
    ]
  }
]; 