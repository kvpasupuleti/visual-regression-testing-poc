import html2canvas from 'html2canvas';
import pixelmatch from 'pixelmatch';
import ResembleJS from 'resemblejs';

// DOM elements
const htmlEditor = document.getElementById('html-editor');
const cssEditor = document.getElementById('css-editor');
const jsEditor = document.getElementById('js-editor');
const runButton = document.getElementById('run-btn');
const testButton = document.getElementById('test-btn');
const userOutputFrame = document.getElementById('user-output');
const expectedOutputFrame = document.getElementById('expected-output');
const visualScoreElement = document.getElementById('visual-score');
const functionalScoreElement = document.getElementById('functional-score');
const totalScoreElement = document.getElementById('total-score');
const diffCanvas = document.getElementById('diff-canvas');

// Solution code sample - this would typically come from your platform's database
const solutionCode = {
  html: `
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
</head>
<body>
  <div class="todo-container">
    <h1>Todo List</h1>
    <div class="input-section">
      <input type="text" id="todo-input" placeholder="Add new task...">
      <button id="add-button">Add</button>
    </div>
    <ul id="todo-list">
      <li class="todo-item">
        <span class="todo-text">Example task</span>
        <button class="delete-btn">Delete</button>
      </li>
    </ul>
  </div>
</body>
</html>
  `,
  css: `
body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  margin: 0;
  padding: 20px;
}

.todo-container {
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
}

.input-section {
  display: flex;
  margin-bottom: 20px;
}

#todo-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
}

#add-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

#todo-list {
  list-style-type: none;
  padding: 0;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.todo-text {
  flex: 1;
}

.delete-btn {
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
  `,
  js: `
document.addEventListener('DOMContentLoaded', function() {
  const todoInput = document.getElementById('todo-input');
  const addButton = document.getElementById('add-button');
  const todoList = document.getElementById('todo-list');

  // Add new todo item
  function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText) {
      const li = document.createElement('li');
      li.className = 'todo-item';
      
      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = todoText;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', function() {
        li.remove();
      });
      
      li.appendChild(span);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
      
      todoInput.value = '';
    }
  }

  // Event listeners
  addButton.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
});
  `
};

// Run user code and display it in the iframe
function runUserCode() {
  // Make sure the iframe exists
  const userOutputFrame = document.getElementById('user-output');
  if (!userOutputFrame) {
    console.error('User output iframe not found');
    return;
  }

  // Create a complete HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>${cssEditor.value}</style>
      </head>
      <body>
        ${htmlEditor.value}
        <script>${jsEditor.value}</script>
      </body>
    </html>
  `;

  // Use a more robust approach to load content into the iframe
  try {
    // Reset the iframe by reloading it
    userOutputFrame.srcdoc = htmlContent;
    
    // Add a load event listener to confirm it loaded
    userOutputFrame.onload = () => {
      console.log('User code loaded successfully');
    };
  } catch (error) {
    console.error('Error running user code:', error);
    alert('Error running code. Please try again.');
  }
}

// Load sample solution into expected output iframe
function loadSolutionCode() {
  // Make sure the iframe exists
  const expectedOutputFrame = document.getElementById('expected-output');
  if (!expectedOutputFrame) {
    console.error('Expected output iframe not found');
    return;
  }

  // Create a complete HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>${solutionCode.css}</style>
      </head>
      <body>
        ${solutionCode.html}
        <script>${solutionCode.js}</script>
      </body>
    </html>
  `;

  // Use a more robust approach to load content into the iframe
  try {
    // Reset the iframe by reloading it
    expectedOutputFrame.srcdoc = htmlContent;
    
    // Add a load event listener to confirm it loaded
    expectedOutputFrame.onload = () => {
      console.log('Solution code loaded successfully');
    };
  } catch (error) {
    console.error('Error loading solution code:', error);
  }
}

// Pre-populate editors with sample code (simplified version of solution)
function populateEditors() {
  htmlEditor.value = `
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
</head>
<body>
  <div class="todo-container">
    <h1>My Todo List</h1>
    <div class="input-section">
      <input type="text" id="todo-input" placeholder="Enter a task...">
      <button id="add-button">Add Task</button>
    </div>
    <ul id="todo-list"></ul>
  </div>
</body>
</html>
  `;
  
  cssEditor.value = `
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  padding: 20px;
}

.todo-container {
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #444;
}

.input-section {
  display: flex;
  margin-bottom: 20px;
}

#todo-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
}

#add-button {
  padding: 10px 15px;
  background-color: #5cb85c;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

#todo-list {
  list-style-type: none;
  padding: 0;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.delete-btn {
  padding: 5px 10px;
  background-color: #d9534f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
  `;
  
  jsEditor.value = `
document.addEventListener('DOMContentLoaded', function() {
  const todoInput = document.getElementById('todo-input');
  const addButton = document.getElementById('add-button');
  const todoList = document.getElementById('todo-list');

  // Function to add a new todo
  function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
      // Create list item
      const li = document.createElement('li');
      li.className = 'todo-item';
      
      // Create text span
      const span = document.createElement('span');
      span.textContent = text;
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      
      // Add event listener to delete button
      deleteBtn.addEventListener('click', function() {
        li.remove();
      });
      
      // Append elements
      li.appendChild(span);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
      
      // Clear input
      todoInput.value = '';
    }
  }

  // Event listeners
  addButton.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
});
  `;
}

// Capture screenshots of both iframes
async function captureScreenshots() {
  // Make sure the iframes exist
  const userOutputFrame = document.getElementById('user-output');
  const expectedOutputFrame = document.getElementById('expected-output');
  
  if (!userOutputFrame || !expectedOutputFrame) {
    throw new Error('Output frames not found');
  }
  
  // Wait for any animations or renders to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Capture user output
    const userOutput = userOutputFrame.contentDocument?.body;
    if (!userOutput) {
      throw new Error('Cannot access user iframe content');
    }
    const userCanvas = await html2canvas(userOutput);
    
    // Capture expected output
    const expectedOutput = expectedOutputFrame.contentDocument?.body;
    if (!expectedOutput) {
      throw new Error('Cannot access expected iframe content');
    }
    const expectedCanvas = await html2canvas(expectedOutput);
    
    return {
      userCanvas,
      expectedCanvas
    };
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    throw new Error('Failed to capture screenshots: ' + error.message);
  }
}

// Compare screenshots using PixelMatch
function compareWithPixelMatch(userCanvas, expectedCanvas) {
  const width = Math.max(userCanvas.width, expectedCanvas.width);
  const height = Math.max(userCanvas.height, expectedCanvas.height);
  
  // Create canvas for diff
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffContext = diffCanvas.getContext('2d');
  const diffImageData = diffContext.createImageData(width, height);
  
  // Create user and expected image data
  const userContext = document.createElement('canvas').getContext('2d');
  userContext.canvas.width = width;
  userContext.canvas.height = height;
  userContext.drawImage(userCanvas, 0, 0);
  const userImageData = userContext.getImageData(0, 0, width, height);
  
  const expectedContext = document.createElement('canvas').getContext('2d');
  expectedContext.canvas.width = width;
  expectedContext.canvas.height = height;
  expectedContext.drawImage(expectedCanvas, 0, 0);
  const expectedImageData = expectedContext.getImageData(0, 0, width, height);
  
  // Compare the images
  const mismatchedPixels = pixelmatch(
    userImageData.data,
    expectedImageData.data,
    diffImageData.data,
    width,
    height,
    { threshold: 0.1 }
  );
  
  // Draw diff image
  diffContext.putImageData(diffImageData, 0, 0);
  
  // Calculate mismatch percentage
  const totalPixels = width * height;
  const matchPercentage = 100 - (mismatchedPixels / totalPixels * 100);
  
  return Math.round(matchPercentage);
}

// Compare screenshots using ResembleJS
function compareWithResembleJS(userCanvas, expectedCanvas) {
  return new Promise(resolve => {
    const userDataUrl = userCanvas.toDataURL();
    const expectedDataUrl = expectedCanvas.toDataURL();
    
    ResembleJS(userDataUrl)
      .compareTo(expectedDataUrl)
      .onComplete(data => {
        resolve(100 - Number(data.misMatchPercentage));
      });
  });
}

// Test E2E functionality in user iframe
async function testE2EFunctionality() {
  const userOutputFrame = document.getElementById('user-output');
  if (!userOutputFrame) {
    console.error('User output iframe not found');
    return 0;
  }
  
  try {
    // Make sure we can access the iframe content
    if (!userOutputFrame.contentWindow || !userOutputFrame.contentDocument) {
      console.error('Cannot access user iframe content window');
      return 0;
    }
    
    // Wait a moment to ensure the iframe content is fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userDoc = userOutputFrame.contentDocument;
    
    // Test 1: Check if input and add button exist
    const input = userDoc.getElementById('todo-input');
    const addButton = userDoc.getElementById('add-button');
    const todoList = userDoc.getElementById('todo-list');
    
    if (!input || !addButton || !todoList) {
      console.log('Missing essential elements in todo app');
      return 0; // Missing essential elements
    }
    
    // Test 2: Add a new todo item
    input.value = 'Test todo item';
    addButton.click();
    
    // Wait for any potential animations
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check if todo was added
    const todoItems = todoList.querySelectorAll('li');
    if (todoItems.length === 0) {
      console.log('Add functionality does not work');
      return 25; // Add functionality doesn't work
    }
    
    // Test 3: Delete a todo item
    const deleteButton = todoItems[0].querySelector('button');
    if (!deleteButton) {
      console.log('Delete button not found');
      return 50; // Delete button doesn't exist
    }
    
    deleteButton.click();
    
    // Wait for any potential animations
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check if todo was deleted
    const todoItemsAfterDelete = todoList.querySelectorAll('li');
    if (todoItemsAfterDelete.length !== 0) {
      console.log('Delete functionality does not work');
      return 75; // Delete functionality doesn't work
    }
    
    console.log('All E2E tests passed successfully');
    return 100; // All functionality works
  } catch (error) {
    console.error('E2E test error:', error);
    return 0; // Error in testing
  }
}

// Run visual regression test
async function runVisualTest() {
  try {
    const userOutputFrame = document.getElementById('user-output');
    const expectedOutputFrame = document.getElementById('expected-output');
    
    if (!userOutputFrame || !expectedOutputFrame) {
      alert('Output frames not found. Please reload the page.');
      return;
    }
    
    // First make sure both frames have content
    if (!userOutputFrame.contentDocument || !userOutputFrame.contentDocument.body) {
      alert('Please run your code first before testing');
      return;
    }
    
    // Wait to ensure that both iframes are fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Starting visual regression test...');
    
    // Capture screenshots
    const { userCanvas, expectedCanvas } = await captureScreenshots();
    
    // Visual comparison
    const pixelMatchScore = compareWithPixelMatch(userCanvas, expectedCanvas);
    console.log('PixelMatch similarity score:', pixelMatchScore + '%');
    
    const resembleScore = await compareWithResembleJS(userCanvas, expectedCanvas);
    console.log('ResembleJS similarity score:', resembleScore + '%');
    
    // Average of both visual scores
    const visualScore = Math.round((pixelMatchScore + resembleScore) / 2);
    console.log('Average visual similarity score:', visualScore + '%');
    
    // Functional test
    const functionalScore = await testE2EFunctionality();
    console.log('Functional test score:', functionalScore + '%');
    
    // Calculate total score (40% visual, 60% functional)
    const totalScore = Math.round(visualScore * 0.4 + functionalScore * 0.6);
    console.log('Total score:', totalScore + '%');
    
    // Display scores
    const visualScoreElement = document.getElementById('visual-score');
    const functionalScoreElement = document.getElementById('functional-score');
    const totalScoreElement = document.getElementById('total-score');
    
    if (visualScoreElement) visualScoreElement.textContent = `${visualScore}%`;
    if (functionalScoreElement) functionalScoreElement.textContent = `${functionalScore}%`;
    if (totalScoreElement) totalScoreElement.textContent = `${totalScore}%`;
    
    // Apply color coding based on scores
    [
      { element: visualScoreElement, score: visualScore },
      { element: functionalScoreElement, score: functionalScore },
      { element: totalScoreElement, score: totalScore }
    ].forEach(({ element, score }) => {
      if (element) {
        if (score >= 80) {
          element.style.color = '#2ecc71';
        } else if (score >= 60) {
          element.style.color = '#f39c12';
        } else {
          element.style.color = '#e74c3c';
        }
      }
    });
    
    console.log('Visual regression test completed successfully');
    
  } catch (error) {
    console.error('Visual testing error:', error);
    alert('An error occurred during testing: ' + error.message);
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  populateEditors();
  
  // Ensure the iframe is loaded before attempting to access its contentDocument
  setTimeout(() => {
    loadSolutionCode();
  }, 100);
  
  runButton.addEventListener('click', runUserCode);
  testButton.addEventListener('click', runVisualTest);
}); 