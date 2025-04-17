// Example student submission for the shopping cart assessment

export const userHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Shopping Cart</title>
</head>
<body>
  <div class="container">
    <h1>My Shopping App</h1>
    
    <div class="products-container">
      <h2>Available Products</h2>
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
      <h2>Shopping Cart</h2>
      <div id="cart-items">
        <!-- Cart items will be added here -->
      </div>
      <div class="cart-summary">
        <div class="total">
          <span>Total Amount:</span>
          <span id="cart-total">$0.00</span>
        </div>
        <button id="checkout-btn" disabled>Proceed to Checkout</button>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const userCSS = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background-color: #f0f2f5;
  color: #333;
  line-height: 1.6;
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
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 30px;
}

.products-container {
  margin-bottom: 40px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.product-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.product-card h3, .product-card p {
  padding: 0 15px;
  margin: 10px 0;
}

.price {
  font-weight: bold;
  color: #e74c3c;
  font-size: 18px;
}

.add-to-cart-btn {
  width: 100%;
  padding: 12px;
  background-color: #3498db;
  color: white;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-to-cart-btn:hover {
  background-color: #2980b9;
}

.cart-container {
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.cart-item-info {
  display: flex;
  align-items: center;
}

.cart-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  margin-right: 15px;
  border-radius: 5px;
}

.quantity-controls {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 35px;
  height: 35px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
}

.quantity {
  width: 50px;
  height: 35px;
  text-align: center;
  border: 1px solid #ddd;
  margin: 0 8px;
  border-radius: 5px;
}

.remove-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  margin-left: 10px;
  cursor: pointer;
  font-weight: bold;
}

.cart-summary {
  margin-top: 30px;
  text-align: right;
}

.total {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
}

#checkout-btn {
  padding: 12px 25px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: background-color 0.3s;
}

#checkout-btn:hover:not([disabled]) {
  background-color: #27ae60;
}

#checkout-btn[disabled] {
  background-color: #95a5a6;
  cursor: not-allowed;
}
`;

export const userJS = `
document.addEventListener('DOMContentLoaded', function() {
  // Products data
  const products = [
    { id: 1, name: 'Product 1', price: 19.99, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Product 2', price: 24.99, image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Product 3', price: 14.99, image: 'https://via.placeholder.com/150' },
    { id: 4, name: 'Product 4', price: 29.99, image: 'https://via.placeholder.com/150' }
  ];
  
  // Shopping cart array
  let cart = [];
  
  // DOM element references
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalElement = document.getElementById('cart-total');
  const checkoutButton = document.getElementById('checkout-btn');
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  
  // Add event listeners to "Add to Cart" buttons
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productId = parseInt(productCard.dataset.id);
      addToCart(productId);
    });
  });
  
  // Function to add a product to cart
  function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      // Increase quantity if product already in cart
      existingItem.quantity += 1;
    } else {
      // Add new item to cart
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    // Update cart display
    updateCartDisplay();
  }
  
  // Function to update cart quantity
  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      removeFromCart(productId);
    } else {
      // Update quantity
      const item = cart.find(item => item.id === productId);
      if (item) {
        item.quantity = newQuantity;
        updateCartDisplay();
      }
    }
  }
  
  // Function to remove item from cart
  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
  }
  
  // Function to update the cart display
  function updateCartDisplay() {
    // Clear current cart display
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
      // Display message if cart is empty
      cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
      checkoutButton.disabled = true;
    } else {
      // Enable checkout button
      checkoutButton.disabled = false;
      
      // Add each cart item to the display
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
        
        // Add event listeners to the cart item controls
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
    
    // Update total price
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = \`$\${total.toFixed(2)}\`;
  }
  
  // Initialize cart display
  updateCartDisplay();
  
  // Checkout button functionality
  checkoutButton.addEventListener('click', function() {
    if (cart.length > 0) {
      alert('Thank you for your purchase! Your order has been placed.');
      cart = [];
      updateCartDisplay();
    }
  });
});
`; 