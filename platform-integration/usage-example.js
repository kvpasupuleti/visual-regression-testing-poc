/**
 * Example usage of the AssessmentRunner in a platform environment
 */

import AssessmentRunner from './assessment-runner.js';
import { solutionHTML, solutionCSS, solutionJS, testScenarios } from '../examples/shopping-cart/solution.js';

// Initialize the assessment runner
const runner = new AssessmentRunner();

// Register assessments
runner.registerAssessment('shopping-cart', {
  solutionHTML,
  solutionCSS,
  solutionJS,
  testScenarios,
  title: 'Shopping Cart Application',
  description: 'Create a shopping cart application with product listing and cart functionality',
  difficulty: 'intermediate',
  // You can add more metadata as needed for your platform
});

// Example user submission (this would come from your platform's database or user input)
const userSubmission = {
  html: `
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
          <span>Total:</span>
          <span id="cart-total">$0.00</span>
        </div>
        <button id="checkout-btn" disabled>Checkout</button>
      </div>
    </div>
  </div>
</body>
</html>
  `,
  css: `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

body {
  background-color: #f5f5f5;
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
  padding-bottom: 10px;
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
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
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
}

#checkout-btn:hover:not([disabled]) {
  background-color: #27ae60;
}

#checkout-btn[disabled] {
  background-color: #95a5a6;
  cursor: not-allowed;
}
  `,
  js: `
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
  `
};

// Example function to evaluate a submission
async function evaluateSubmission(assessmentId, userSubmission) {
  try {
    // Run tests on the user submission
    const results = await runner.runTests(
      assessmentId,
      userSubmission.html,
      userSubmission.css,
      userSubmission.js
    );
    
    // Display results (in a real platform, you would save these to a database)
    console.log('Assessment Results:');
    console.log('-------------------');
    console.log(`Visual Score: ${results.visualScore}%`);
    console.log(`Functional Score: ${results.functionalScore}%`);
    console.log(`Total Score: ${results.totalScore}%`);
    
    // Display test results
    console.log('\nFunctional Test Results:');
    console.log('------------------------');
    
    results.testResults.forEach(test => {
      console.log(`${test.passed ? '✓' : '✗'} ${test.name}`);
      
      test.steps.forEach(step => {
        console.log(`  ${step.passed ? '✓' : '✗'} ${step.details}`);
      });
      
      if (test.error) {
        console.log(`  Error: ${test.error}`);
      }
      
      console.log('');
    });
    
    // In a real platform, you could save the diff image URL to show to the user
    console.log('Diff image generated:', results.diffImageUrl.substring(0, 50) + '...');
    
    // Clean up after testing
    runner.cleanup();
    
    return results;
  } catch (error) {
    console.error('Error evaluating submission:', error);
    throw error;
  }
}

// Example server endpoint (Express.js)
// In a real platform, this would be part of your server code
function setupServerEndpoint(app) {
  app.post('/api/assessments/:id/evaluate', async (req, res) => {
    try {
      const assessmentId = req.params.id;
      const userSubmission = req.body;
      
      const results = await evaluateSubmission(assessmentId, userSubmission);
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// Example usage in a browser environment
// This would be separated into appropriate frontend and backend code in a real platform
function exampleBrowserUsage() {
  // Simulate a button click to evaluate the submission
  document.getElementById('evaluate-button').addEventListener('click', async () => {
    try {
      // In a real application, you would get these values from your code editors
      const results = await evaluateSubmission('shopping-cart', userSubmission);
      
      // Display the results in the UI
      document.getElementById('visual-score').textContent = `${results.visualScore}%`;
      document.getElementById('functional-score').textContent = `${results.functionalScore}%`;
      document.getElementById('total-score').textContent = `${results.totalScore}%`;
      
      // Display the diff image
      document.getElementById('diff-image').src = results.diffImageUrl;
      
      // Display test results
      const testResultsContainer = document.getElementById('test-results');
      testResultsContainer.innerHTML = '';
      
      results.testResults.forEach(test => {
        const testElement = document.createElement('div');
        testElement.className = `test-result ${test.passed ? 'test-pass' : 'test-fail'}`;
        
        testElement.innerHTML = `
          <h3>
            <span>${test.passed ? '✓' : '✗'}</span>
            <span>${test.name}</span>
          </h3>
          <div class="steps">
            ${test.steps.map(step => `
              <div class="step ${step.passed ? 'step-pass' : 'step-fail'}">
                <span>${step.details}</span>
                <span>${step.passed ? '✓' : '✗'}</span>
              </div>
            `).join('')}
            ${test.error ? `<div class="step step-fail">Error: ${test.error}</div>` : ''}
          </div>
        `;
        
        testResultsContainer.appendChild(testElement);
      });
    } catch (error) {
      console.error('Error evaluating submission:', error);
      alert('An error occurred while evaluating the submission');
    }
  });
}

// Export functions for use in your platform
export {
  evaluateSubmission,
  setupServerEndpoint,
  exampleBrowserUsage
}; 