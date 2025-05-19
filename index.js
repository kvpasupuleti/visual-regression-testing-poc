import html2canvas from 'html2canvas';
import pixelmatch from 'pixelmatch';
import ResembleJS from 'resemblejs';

// DOM elements
const htmlEditor = document.getElementById('html-editor');
const cssEditor = document.getElementById('css-editor');
const jsEditor = document.getElementById('js-editor');
const runButton = document.getElementById('run-btn');
const testButton = document.getElementById('test-btn');

// Solution code editors
const solutionHtmlEditor = document.getElementById('solution-html-editor');
const solutionCssEditor = document.getElementById('solution-css-editor');
const solutionJsEditor = document.getElementById('solution-js-editor');
const updateSolutionButton = document.getElementById('update-solution-btn');

// Output frames
const userOutputFrame = document.getElementById('user-output');
const expectedOutputFrame = document.getElementById('expected-output');

// Score elements
const visualScoreElement = document.getElementById('visual-score');
const functionalScoreElement = document.getElementById('functional-score');
const totalScoreElement = document.getElementById('total-score');
const diffCanvas = document.getElementById('diff-canvas');

// DOM elements for custom test cases
const customTestsEditor = document.getElementById('custom-tests-editor');
const saveTestsButton = document.getElementById('save-tests-btn');
const runCustomTestsButton = document.getElementById('run-custom-tests-btn');

// Default solution code
const DEFAULT_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
</head>
<body>
  <div class="todo-container">
    <h1>Todo List</h1>
    <div class="todo-input-container">
      <input type="text" id="todo-input" placeholder="Enter a task">
      <button id="add-button">Add</button>
    </div>
    <ul id="todo-list"></ul>
  </div>
</body>
</html>
`;

const DEFAULT_CSS = `
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.todo-container {
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
}

.todo-input-container {
  display: flex;
  margin-bottom: 20px;
}

#todo-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 16px;
}

#add-button {
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 16px;
}

#add-button:hover {
  background-color: #45a049;
}

#todo-list {
  list-style-type: none;
  padding: 0;
}

#todo-list li {
  padding: 10px 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s;
}

#todo-list li:hover {
  background-color: #f0f0f0;
}

#todo-list button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
}

#todo-list button:hover {
  background-color: #c0392b;
}
`;

const DEFAULT_JS = `
document.addEventListener('DOMContentLoaded', function() {
  const todoInput = document.getElementById('todo-input');
  const addButton = document.getElementById('add-button');
  const todoList = document.getElementById('todo-list');

  // Add a new todo item
  function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText === '') return;
    
    const li = document.createElement('li');
    li.innerHTML = todoText + '<button>Delete</button>';
    
    // Add delete functionality
    li.querySelector('button').addEventListener('click', function() {
      li.remove();
    });
    
    todoList.appendChild(li);
    todoInput.value = '';
    todoInput.focus();
  }
  
  // Add todo when Add button is clicked
  addButton.addEventListener('click', addTodo);
  
  // Add todo when Enter key is pressed in input
  todoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
});
`;

// Default custom tests
const defaultCustomTests = [
  {
    name: 'Todo list exists',
    test: function(doc) { 
      return doc.getElementById('todo-list') !== null;
    },
    weight: 10
  },
  {
    name: 'Add button exists',
    test: function(doc) { 
      return doc.getElementById('add-button') !== null;
    },
    weight: 10
  },
  {
    name: 'Can add a new item',
    test: function(doc) {
      const input = doc.getElementById('todo-input');
      const button = doc.getElementById('add-button');
      const list = doc.getElementById('todo-list');
      if (!input || !button || !list) return false;
      
      // Count initial items
      const initialCount = list.children.length;
      
      // Simulate adding a new item
      input.value = 'Test item';
      button.click();
      
      // Check if a new item was added
      return list.children.length > initialCount;
    },
    weight: 40
  },
  {
    name: 'Delete button works',
    test: function(doc) {
      const list = doc.getElementById('todo-list');
      if (!list || list.children.length === 0) return false;
      
      // Get the first todo item
      const item = list.children[0];
      const deleteBtn = item.querySelector('button');
      if (!deleteBtn) return false;
      
      // Count initial items
      const initialCount = list.children.length;
      
      // Click delete button
      deleteBtn.click();
      
      // Check if item was removed
      return list.children.length < initialCount;
    },
    weight: 40
  }
];

// Load default code in solution editor
solutionHtmlEditor.value = DEFAULT_HTML.trim();
solutionCssEditor.value = DEFAULT_CSS.trim();
solutionJsEditor.value = DEFAULT_JS.trim();

// Load default code in the user editors (for testing convenience)
htmlEditor.value = DEFAULT_HTML.trim();
cssEditor.value = DEFAULT_CSS.trim();
jsEditor.value = DEFAULT_JS.trim();

// Event listeners
runButton.addEventListener('click', runUserCode);
testButton.addEventListener('click', runVisualTest);
updateSolutionButton.addEventListener('click', updateSolutionCode);

// Function to show a toast message
function showToast(message, type = 'success') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Add styles for the toast
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }
      .toast {
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
        transform: translateY(20px);
      }
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      .toast.success {
        background-color: #27ae60;
      }
      .toast.error {
        background-color: #e74c3c;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  // Show the toast
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Load solution code into the expected output iframe
function updateSolutionCode() {
  const expectedOutputFrame = document.getElementById('expected-output');
  if (!expectedOutputFrame) {
    console.error('Expected output iframe not found');
    return;
  }
  
  try {
    const html = solutionHtmlEditor.value;
    const css = solutionCssEditor.value;
    const js = solutionJsEditor.value;
    
    // Create a complete HTML document
    const fullHtml = createFullHtml(html, css, js);
    
    // Set the HTML content using srcdoc
    expectedOutputFrame.srcdoc = fullHtml;
    
    console.log('Solution code updated successfully');
    showToast('Solution code updated successfully');
  } catch (error) {
    console.error('Error updating solution code:', error);
    showToast('Error updating solution code: ' + error.message, 'error');
  }
}

// Add functionality for toggling collapsible sections
function setupToggleButtons() {
  const toggleButtons = document.querySelectorAll('.toggle-btn');
  toggleButtons.forEach(button => {
    const targetId = button.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);
    
    // Start with solution section collapsed by default
    if (targetId === 'solution-code-section') {
      targetSection.classList.add('collapsed');
      button.textContent = 'Expand';
    }
    
    button.addEventListener('click', () => {
      // Toggle the collapsed state
      if (targetSection.classList.contains('collapsed')) {
        targetSection.style.maxHeight = targetSection.scrollHeight + 'px';
        targetSection.classList.remove('collapsed');
        button.textContent = 'Collapse';
        
        // After transition completes, set to 'auto' to handle dynamic content
        setTimeout(() => {
          targetSection.style.maxHeight = 'none';
        }, 300);
      } else {
        // Set explicit height before collapsing
        targetSection.style.maxHeight = targetSection.scrollHeight + 'px';
        setTimeout(() => {
          targetSection.style.maxHeight = '0';
          targetSection.classList.add('collapsed');
          button.textContent = 'Expand';
        }, 10);
      }
    });
  });
}

// Test E2E functionality in user iframe by comparing to solution iframe
async function testE2EFunctionality() {
  const userOutputFrame = document.getElementById('user-output');
  const expectedOutputFrame = document.getElementById('expected-output');
  
  if (!userOutputFrame || !expectedOutputFrame) {
    console.error('Output frames not found');
    return 0;
  }
  
  try {
    // Make sure we can access both iframe content
    if (!userOutputFrame.contentWindow || !userOutputFrame.contentDocument) {
      console.error('Cannot access user iframe content window');
      return 0;
    }
    
    if (!expectedOutputFrame.contentWindow || !expectedOutputFrame.contentDocument) {
      console.error('Cannot access expected iframe content window');
      return 0;
    }
    
    // Wait to ensure the iframe content is fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userDoc = userOutputFrame.contentDocument;
    const expectedDoc = expectedOutputFrame.contentDocument;
    
    // Create test harnesses in both iframes to avoid affecting visible UI
    const createTestHarness = (doc, prefix) => {
      const harness = doc.createElement('div');
      harness.id = `${prefix}-test-harness`;
      harness.style.position = 'absolute';
      harness.style.visibility = 'hidden';
      harness.style.pointerEvents = 'none';
      doc.body.appendChild(harness);
      return harness;
    };
    
    const userHarness = createTestHarness(userDoc, 'user');
    const expectedHarness = createTestHarness(expectedDoc, 'expected');
    
    // Get references to key elements in both iframes
    const getUserElements = (doc) => ({
      input: doc.getElementById('todo-input'),
      addButton: doc.getElementById('add-button'),
      todoList: doc.getElementById('todo-list')
    });
    
    const userElements = getUserElements(userDoc);
    const expectedElements = getUserElements(expectedDoc);
    
    // Check if required elements exist
    if (!userElements.input || !userElements.addButton || !userElements.todoList) {
      console.log('Missing essential elements in user todo app');
      return 0;
    }
    
    if (!expectedElements.input || !expectedElements.addButton || !expectedElements.todoList) {
      console.log('Missing essential elements in expected todo app');
      return 0;
    }
    
    // Start with a score of 25 for having the basic structure
    let score = 25;
    
    // Clone the elements and their event listeners to test functionality
    const userAddButtonClone = userElements.addButton.cloneNode(true);
    const expectedAddButtonClone = expectedElements.addButton.cloneNode(true);
    
    // Check 1: Test if the add button has click event handling
    // We'll do this by checking if event handlers are present
    const addButtonHasEvents = hasEventListeners(userElements.addButton, 'click');
    if (addButtonHasEvents) {
      console.log('User has add button click handler: +25 points');
      score += 25;
    } else {
      console.log('User is missing add button click handler');
    }
    
    // Check 2: Test if the input has keypress/keydown event handling
    const inputHasEvents = 
      hasEventListeners(userElements.input, 'keypress') || 
      hasEventListeners(userElements.input, 'keydown') || 
      hasEventListeners(userElements.input, 'keyup');
    
    if (inputHasEvents) {
      console.log('User has input key event handler: +25 points');
      score += 25;
    } else {
      console.log('User is missing input key event handler');
    }
    
    // Check 3: Does the code have logic for delete buttons?
    // We'll inspect if there's code to handle deletion
    const hasDeleteFunctionality = checkDeleteFunctionality(userDoc);
    
    if (hasDeleteFunctionality) {
      console.log('User has delete button functionality: +25 points');
      score += 25;
    } else {
      console.log('User is missing delete button functionality');
    }
    
    // Cleanup
    userDoc.body.removeChild(userHarness);
    expectedDoc.body.removeChild(expectedHarness);
    
    return score;
  } catch (error) {
    console.error('E2E test error:', error);
    return 0; // Error in testing
  }
}

// Helper function to check if an element has event listeners
function hasEventListeners(element, eventType) {
  if (!element) return false;
  
  // Try to detect event handlers using different methods
  
  // Method 1: Check for inline event attributes
  if (element.getAttribute(`on${eventType}`)) {
    return true;
  }
  
  // Method 2: Check for properties like onclick
  const propName = `on${eventType}`;
  if (element[propName] && typeof element[propName] === 'function') {
    return true;
  }
  
  // Method 3: Check if the script contains references to the element ID and event
  const scripts = Array.from(element.ownerDocument.querySelectorAll('script'));
  const elementId = element.id;
  
  if (elementId) {
    for (const script of scripts) {
      const scriptContent = script.textContent || '';
      
      // Look for patterns like "getElementById('elementId').addEventListener('eventType'" or similar
      if (scriptContent.includes(elementId) && 
          (scriptContent.includes(`addEventListener('${eventType}'`) || 
           scriptContent.includes(`addEventListener("${eventType}"`) ||
           scriptContent.includes(`.${eventType}`) ||
           scriptContent.includes(`on${eventType}`))) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to check for delete functionality
function checkDeleteFunctionality(doc) {
  // 1. Check for existing delete buttons
  const todoList = doc.getElementById('todo-list');
  if (!todoList) return false;
  
  const deleteButtons = todoList.querySelectorAll('button');
  if (deleteButtons.length > 0) {
    // Check if any button has text content suggesting deletion
    for (const button of deleteButtons) {
      if (button.textContent.toLowerCase().includes('delete') ||
          button.textContent.toLowerCase().includes('remove') ||
          button.className.toLowerCase().includes('delete') ||
          button.id.toLowerCase().includes('delete')) {
        return true;
      }
    }
  }
  
  // 2. Check scripts for delete/remove references
  const scripts = Array.from(doc.querySelectorAll('script'));
  for (const script of scripts) {
    const scriptContent = script.textContent || '';
    
    // Look for common patterns in delete functionality
    if ((scriptContent.includes('remove(') || scriptContent.includes('.remove()')) && 
        (scriptContent.includes('click') || scriptContent.includes('delete'))) {
      return true;
    }
    
    // Check for removeChild or removeElement methods
    if ((scriptContent.includes('removeChild') || scriptContent.includes('removeElement')) && 
        (scriptContent.includes('click') || scriptContent.includes('delete'))) {
      return true;
    }
  }
  
  return false;
}

// Run visual regression test
async function runVisualTest() {
  // Show loading state
  const testButton = document.getElementById('test-btn');
  if (testButton) {
    testButton.classList.add('loading');
    testButton.disabled = true;
  }
  
  try {
    const userOutputFrame = document.getElementById('user-output');
    const expectedOutputFrame = document.getElementById('expected-output');
    
    if (!userOutputFrame || !expectedOutputFrame) {
      showToast('Output frames not found. Please reload the page.', 'error');
      return;
    }
    
    // First make sure both frames have content
    if (!userOutputFrame.contentDocument || !userOutputFrame.contentDocument.body) {
      showToast('Please run your code first before testing', 'error');
      return;
    }
    
    console.log('Starting visual regression test...');
    
    try {
      // Capture screenshots without causing visual changes
      const { userCanvas, expectedCanvas } = await captureScreenshots();
      
      // Visual comparison
      const pixelMatchScore = compareWithPixelMatch(userCanvas, expectedCanvas);
      console.log('PixelMatch similarity score:', pixelMatchScore + '%');
      
      const resembleScore = await compareWithResembleJS(userCanvas, expectedCanvas);
      console.log('ResembleJS similarity score:', resembleScore + '%');
      
      // Average of both visual scores
      const visualScore = Math.round((pixelMatchScore + resembleScore) / 2);
      console.log('Average visual similarity score:', visualScore + '%');
      
      // Check if we should use custom tests
      const useCustomScoreCheckbox = document.getElementById('use-custom-tests-score');
      let functionalScore = 0;
      
      if (useCustomScoreCheckbox && useCustomScoreCheckbox.checked) {
        // Run custom tests and use their score
        await runCustomTests();
        // The custom test function will update the functionalScoreElement
        // We'll just need to get the value for total score calculation
        const scoreText = functionalScoreElement.textContent;
        functionalScore = parseInt(scoreText, 10) || 0;
      } else {
        // Functional test (default)
        functionalScore = await testE2EFunctionality();
        console.log('Functional test score:', functionalScore + '%');
        
        // Update functional score display
        functionalScoreElement.textContent = functionalScore + '%';
        applyScoreColor(functionalScoreElement, functionalScore);
      }
      
      // Update visual score display
      visualScoreElement.textContent = visualScore + '%';
      applyScoreColor(visualScoreElement, visualScore);
      
      // Calculate total score (40% visual, 60% functional)
      const totalScore = Math.round(visualScore * 0.4 + functionalScore * 0.6);
      console.log('Total score:', totalScore + '%');
      
      // Update total score display
      totalScoreElement.textContent = totalScore + '%';
      applyScoreColor(totalScoreElement, totalScore);
      
      console.log('Visual regression test completed successfully');
      showToast('Testing completed successfully');
    } catch (error) {
      // Update the error handler part of runVisualTest to match the simplified diff canvas
      if (error.message && error.message.includes('Image sizes do not match')) {
        console.warn('Image size mismatch detected, attempting to continue with fixed dimensions');
        
        // Create a message in the diff canvas
        if (diffCanvas && diffCanvas.getContext) {
          const ctx = diffCanvas.getContext('2d');
          
          // Set reasonable canvas size
          diffCanvas.width = 500;
          diffCanvas.height = 150;
          
          // Clear and draw a helpful message
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 500, 150);
          
          // Draw border
          ctx.strokeStyle = '#ddd';
          ctx.lineWidth = 2;
          ctx.strokeRect(5, 5, 490, 140);
          
          // Add warning icon
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = '#f39c12';
          ctx.fillText('⚠️', 20, 60);
          
          // Add message text
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#333';
          ctx.fillText('Display Size Mismatch Detected', 70, 40);
          
          ctx.font = '14px Arial'; 
          ctx.fillStyle = '#555';
          
          // Add dimensions info if available
          const userRect = userOutputFrame.getBoundingClientRect();
          const expectedRect = expectedOutputFrame.getBoundingClientRect();
          ctx.fillText(`User: ${Math.round(userRect.width)}x${Math.round(userRect.height)}px`, 70, 70);
          ctx.fillText(`Expected: ${Math.round(expectedRect.width)}x${Math.round(expectedRect.height)}px`, 70, 95);
          
          // Add helpful suggestion
          ctx.fillText('Try resizing your browser or viewing in a different device.', 70, 125);
        }
        
        // Get functional score instead
        let functionalScore = 0;
        const useCustomScoreCheckbox = document.getElementById('use-custom-tests-score');
        
        if (useCustomScoreCheckbox && useCustomScoreCheckbox.checked) {
          await runCustomTests();
          const scoreText = functionalScoreElement.textContent;
          functionalScore = parseInt(scoreText, 10) || 0;
        } else {
          functionalScore = await testE2EFunctionality();
          functionalScoreElement.textContent = functionalScore + '%';
          applyScoreColor(functionalScoreElement, functionalScore);
        }
        
        // Set visual score to N/A
        visualScoreElement.textContent = 'N/A';
        visualScoreElement.style.color = '#888';
        
        // Use functional score as the total score
        totalScoreElement.textContent = functionalScore + '%';
        applyScoreColor(totalScoreElement, functionalScore);
        
        // Show a more specific toast message
        showToast('Visual comparison skipped due to size mismatch. Using functional score only.', 'error');
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  } catch (error) {
    console.error('Visual testing error:', error);
    showToast('An error occurred during testing: ' + error.message, 'error');
  } finally {
    // Hide loading state regardless of success or failure
    if (testButton) {
      testButton.classList.remove('loading');
      testButton.disabled = false;
    }
  }
}

// Helper function to update score display (renamed from updateScoreDisplay)
function updateAllScores(visualScore, functionalScore, totalScore) {
  if (visualScoreElement) visualScoreElement.textContent = `${visualScore}%`;
  if (functionalScoreElement) functionalScoreElement.textContent = `${functionalScore}%`;
  if (totalScoreElement) totalScoreElement.textContent = `${totalScore}%`;
  
  // Apply color coding based on scores
  if (visualScoreElement) applyScoreColor(visualScoreElement, visualScore);
  if (functionalScoreElement) applyScoreColor(functionalScoreElement, functionalScore);
  if (totalScoreElement) applyScoreColor(totalScoreElement, totalScore);
}

// Helper function to create a full HTML document
function createFullHtml(html, css, js) {
  // Extract body content from HTML if it exists
  let bodyContent = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    bodyContent = bodyMatch[1];
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${css}</style>
    </head>
    <body>
      ${bodyContent}
      <script>${js}</script>
    </body>
    </html>
  `;
}

// Run user code and display it in the iframe
function runUserCode() {
  const userOutputFrame = document.getElementById('user-output');
  if (!userOutputFrame) {
    console.error('User output iframe not found');
    return;
  }
  
  try {
    const html = htmlEditor.value;
    const css = cssEditor.value;
    const js = jsEditor.value;
    
    // Create a complete HTML document
    const fullHtml = createFullHtml(html, css, js);
    
    // Set the HTML content using srcdoc
    userOutputFrame.srcdoc = fullHtml;
    
    console.log('User code executed successfully');
    showToast('Code executed successfully');
  } catch (error) {
    console.error('Error running user code:', error);
    showToast('Error running code: ' + error.message, 'error');
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
  
  // Instead of waiting, we ensure both frames are fully loaded
  // This avoids additional waiting time that might cause rendering shifts
  const userOutput = userOutputFrame.contentDocument?.body;
  if (!userOutput) {
    throw new Error('Cannot access user iframe content');
  }
  
  const expectedOutput = expectedOutputFrame.contentDocument?.body;
  if (!expectedOutput) {
    throw new Error('Cannot access expected iframe content');
  }
  
  try {
    console.log("Preparing to capture screenshots...");
    
    // Temporarily resize iframes to show full content by setting a large height
    const originalUserHeight = userOutputFrame.style.height;
    const originalExpectedHeight = expectedOutputFrame.style.height;
    
    // Step 1: Calculate the full height of the content in each iframe
    const userContentHeight = Math.max(
      userOutput.scrollHeight,
      userOutput.offsetHeight,
      userOutput.clientHeight,
      userOutputFrame.contentDocument.documentElement.scrollHeight || 0,
      userOutputFrame.contentDocument.documentElement.offsetHeight || 0,
      userOutputFrame.contentDocument.documentElement.clientHeight || 0
    );
    
    const expectedContentHeight = Math.max(
      expectedOutput.scrollHeight,
      expectedOutput.offsetHeight,
      expectedOutput.clientHeight,
      expectedOutputFrame.contentDocument.documentElement.scrollHeight || 0,
      expectedOutputFrame.contentDocument.documentElement.offsetHeight || 0,
      expectedOutputFrame.contentDocument.documentElement.clientHeight || 0
    );
    
    console.log(`Full content heights - User: ${userContentHeight}px, Expected: ${expectedContentHeight}px`);
    
    // First create the canvas(es) at the correct size
    const userCanvas = document.createElement('canvas');
    const expectedCanvas = document.createElement('canvas');
    
    // Limit maximum height to prevent browser crashes with huge canvases
    const maxHeight = 3000; 
    const targetHeight = Math.min(Math.max(userContentHeight, expectedContentHeight), maxHeight);
    
    // Standardize width for comparison
    const standardWidth = Math.min(
      userOutputFrame.clientWidth, 
      expectedOutputFrame.clientWidth
    );
    
    // Set canvas dimensions
    userCanvas.width = standardWidth;
    userCanvas.height = targetHeight;
    expectedCanvas.width = standardWidth;
    expectedCanvas.height = targetHeight;
    
    console.log(`Canvas dimensions: ${standardWidth}x${targetHeight}`);
    
    // Create contexts
    const userContext = userCanvas.getContext('2d');
    const expectedContext = expectedCanvas.getContext('2d');
    
    // Set white background for both canvases
    userContext.fillStyle = "#FFFFFF";
    userContext.fillRect(0, 0, standardWidth, targetHeight);
    expectedContext.fillStyle = "#FFFFFF";
    expectedContext.fillRect(0, 0, standardWidth, targetHeight);
    
    // Adjust iframe sizes to show all content
    userOutputFrame.style.width = standardWidth + 'px';
    userOutputFrame.style.height = targetHeight + 'px';
    expectedOutputFrame.style.width = standardWidth + 'px';
    expectedOutputFrame.style.height = targetHeight + 'px';
    
    // Wait for resize to take effect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Capture screenshots using html2canvas
    console.log("Capturing user output...");
    try {
      await html2canvas(userOutput, {
        canvas: userCanvas,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        scale: 1,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: true,
        x: 0,
        y: 0,
        width: standardWidth,
        height: targetHeight
      });
      console.log("User output captured");
    } catch (error) {
      console.error("Error capturing user output:", error);
      throw new Error("Failed to capture user output: " + error.message);
    }
    
    console.log("Capturing expected output...");
    try {
      await html2canvas(expectedOutput, {
        canvas: expectedCanvas,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
        scale: 1,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: true,
        x: 0,
        y: 0,
        width: standardWidth,
        height: targetHeight
      });
      console.log("Expected output captured");
    } catch (error) {
      console.error("Error capturing expected output:", error);
      throw new Error("Failed to capture expected output: " + error.message);
    }
    
    // Restore original iframe heights
    userOutputFrame.style.width = '';
    userOutputFrame.style.height = originalUserHeight;
    expectedOutputFrame.style.width = '';
    expectedOutputFrame.style.height = originalExpectedHeight;
    
    console.log("Screenshots captured successfully");
    
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
  try {
    console.log("Starting visual comparison...");
    
    // Determine the target dimensions for comparison
    // Use the minimum width and height to ensure both images fit
    const targetWidth = Math.min(userCanvas.width, expectedCanvas.width);
    const targetHeight = Math.min(userCanvas.height, expectedCanvas.height);
    
    console.log(`Canvas dimensions for comparison: ${targetWidth}x${targetHeight}`);
    
    // Get or create diff canvas
    let diffContext;
    if (diffCanvas) {
      diffCanvas.width = targetWidth;
      diffCanvas.height = targetHeight + 60; // Add space for header
      diffContext = diffCanvas.getContext('2d');
      console.log("Using existing diff canvas");
    } else {
      console.warn("Diff canvas not found in DOM, creating temporary canvas");
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight + 60;
      diffContext = tempCanvas.getContext('2d');
    }
    
    // Clear the canvas with background color
    diffContext.fillStyle = "#ffffff";
    diffContext.fillRect(0, 0, targetWidth, targetHeight + 60);
    
    // Add header text
    diffContext.font = "bold 14px Arial";
    diffContext.fillStyle = "#333";
    diffContext.textAlign = "left";
    diffContext.fillText("Visual Differences (Full Page Comparison)", 10, 30);
    
    // Create a simple comparison
    console.log("Preparing image data for comparison...");
    
    // Create image data from both canvases
    const userImageData = userCanvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    const expectedImageData = expectedCanvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    const diffImageData = diffContext.createImageData(targetWidth, targetHeight);
    
    // Set diff options
    const diffOptions = {
      threshold: 0.15,
      includeAA: true,
      alpha: 0.8,
      diffColor: [231, 76, 60],    // Brighter red (#e74c3c)
      diffColorAlt: [52, 152, 219], // Brighter blue (#3498db)
      diffMask: false
    };
    
    // Compare the images
    console.log("Running pixel comparison...");
    const mismatchedPixels = pixelmatch(
      userImageData.data,
      expectedImageData.data,
      diffImageData.data,
      targetWidth,
      targetHeight,
      diffOptions
    );
    console.log(`Comparison complete. Found ${mismatchedPixels} mismatched pixels.`);
    
    // First draw a very faded version of the original for context
    diffContext.globalAlpha = 0.2;
    diffContext.drawImage(userCanvas, 0, 0, targetWidth, targetHeight, 0, 60, targetWidth, targetHeight);
    diffContext.globalAlpha = 1.0;
    
    // Draw the diff data
    console.log("Drawing diff visualization...");
    diffContext.putImageData(diffImageData, 0, 60);
    
    // Calculate mismatch percentage
    const totalPixels = targetWidth * targetHeight;
    const matchPercentage = 100 - (mismatchedPixels / totalPixels * 100);
    const percentageMismatch = (mismatchedPixels / totalPixels * 100).toFixed(2);
    
    // Add info about detected differences
    diffContext.font = "12px Arial";
    diffContext.fillStyle = "#666";
    diffContext.textAlign = "right";
    diffContext.fillText(`Differences detected: ${mismatchedPixels} pixels (${percentageMismatch}%)`, targetWidth - 10, 30);
    
    console.log("Visual comparison completed successfully");
    return Math.round(matchPercentage);
  } catch (error) {
    console.error("ERROR IN VISUAL COMPARISON:", error);
    
    // Create a simple error display
    if (diffCanvas) {
      const ctx = diffCanvas.getContext('2d');
      diffCanvas.width = 500;
      diffCanvas.height = 200;
      
      ctx.fillStyle = "#fff0f0";
      ctx.fillRect(0, 0, 500, 200);
      
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#e74c3c";
      ctx.textAlign = "center";
      ctx.fillText("Error in Visual Comparison", 250, 50);
      
      ctx.font = "14px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.fillText(error.message, 250, 80);
      ctx.fillText("Check browser console for details", 250, 110);
    }
    
    return 0; // Return 0% match on error
  }
}

// Compare screenshots using ResembleJS
function compareWithResembleJS(userCanvas, expectedCanvas) {
  return new Promise(resolve => {
    try {
      // First ensure both canvases have the same dimensions by creating new canvases
      const width = Math.min(userCanvas.width, expectedCanvas.width);
      const height = Math.min(userCanvas.height, expectedCanvas.height);
      
      // Create temp canvases with matching dimensions
      const userTemp = document.createElement('canvas');
      userTemp.width = width;
      userTemp.height = height;
      userTemp.getContext('2d').drawImage(userCanvas, 0, 0, width, height);
      
      const expectedTemp = document.createElement('canvas');
      expectedTemp.width = width;
      expectedTemp.height = height;
      expectedTemp.getContext('2d').drawImage(expectedCanvas, 0, 0, width, height);
      
      // Get data URLs from temp canvases
      const userDataUrl = userTemp.toDataURL();
      const expectedDataUrl = expectedTemp.toDataURL();
      
      // Configure ResembleJS options
      const resembleOptions = {
        errorType: 'movement',  // emphasize structural differences
        scaleToSameSize: true,  // ensure size matching
        ignoreAntialiasing: true,  // reduce false positives
        outputDiff: false  // we don't need the diff image from ResembleJS
      };
      
      // Compare the normalized images
      ResembleJS(userDataUrl)
        .compareTo(expectedDataUrl)
        .ignoreColors()  // focus on structure, not colors
        .ignoreAntialiasing()
        .onComplete(data => {
          const score = 100 - Number(data.misMatchPercentage);
          console.log(`ResembleJS comparison (${width}x${height}): ${score}%`);
          resolve(score);
        });
    } catch (error) {
      console.error('Error in ResembleJS comparison:', error);
      resolve(0); // Return 0 on error to avoid breaking the test
    }
  });
}

// Setup tooltips for accessibility
function setupTooltips() {
  const infoIcons = document.querySelectorAll('.info-icon');
  
  infoIcons.forEach(icon => {
    // Add tabindex to make the icon focusable
    icon.setAttribute('tabindex', '0');
    
    // Add role for accessibility
    icon.setAttribute('role', 'button');
    icon.setAttribute('aria-label', 'Information');
    
    // Create tooltip element for this icon
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = icon.getAttribute('title');
    tooltip.style.display = 'none';
    icon.appendChild(tooltip);
    
    // Remove the title to prevent default tooltip
    const tooltipText = icon.getAttribute('title');
    icon.removeAttribute('title');
    icon.setAttribute('data-tooltip', tooltipText);
    
    // Show tooltip on mouse enter
    icon.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });
    
    // Show tooltip on focus (for keyboard users)
    icon.addEventListener('focus', () => {
      tooltip.style.display = 'block';
    });
    
    // Hide tooltip on mouse leave
    icon.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
    
    // Hide tooltip on blur (for keyboard users)
    icon.addEventListener('blur', () => {
      tooltip.style.display = 'none';
    });
    
    // Toggle tooltip on click for mobile users
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      if (tooltip.style.display === 'block') {
        tooltip.style.display = 'none';
      } else {
        tooltip.style.display = 'block';
      }
    });
    
    // Hide tooltip on Escape key
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        tooltip.style.display = 'none';
        icon.blur();
      }
    });
  });
}

// Load saved tests or set defaults
function loadCustomTests() {
  try {
    const savedTests = localStorage.getItem('customTests');
    if (savedTests) {
      customTestsEditor.value = savedTests;
    } else {
      // Convert the default tests to a string representation with functions
      const testsString = defaultCustomTests.map(test => {
        // Convert each test object to a string with function intact
        const funcStr = test.test.toString();
        console.log(funcStr);
        return `  {
    name: ${JSON.stringify(test.name)},
    test: ${funcStr},
    weight: ${test.weight}
  }`;
      }).join(',\n');
      
      // Format as a proper array
      customTestsEditor.value = `[\n${testsString}\n]`;
    }
  } catch (error) {
    console.error('Error loading custom tests:', error);
    // Fallback for errors
    const fallbackTests = `[
  {
    name: "Todo list exists",
    test: function(doc) { 
      return doc.getElementById('todo-list') !== null;
    },
    weight: 10
  },
  {
    name: "Add button exists",
    test: function(doc) { 
      return doc.getElementById('add-button') !== null;
    },
    weight: 10
  }
]`;
    customTestsEditor.value = fallbackTests;
  }
}

// Save custom tests to localStorage
function saveCustomTests() {
  try {
    localStorage.setItem('customTests', customTestsEditor.value);
    showToast('Custom tests saved successfully');
  } catch (error) {
    console.error('Error saving custom tests:', error);
    showToast('Error saving custom tests: ' + error.message, 'error');
  }
}

// Parse custom tests from editor
function parseCustomTests() {
  try {
    // Use Function constructor to safely evaluate the JSON with functions
    const testFunctionsString = `return ${customTestsEditor.value}`;
    const testFunctions = new Function(testFunctionsString)();
    
    // Validate the structure
    if (!Array.isArray(testFunctions)) {
      throw new Error('Custom tests must be an array of objects');
    }
    
    // Validate each test
    testFunctions.forEach((test, index) => {
      if (!test.name || typeof test.name !== 'string') {
        throw new Error(`Test #${index + 1} is missing a valid name property`);
      }
      if (!test.test || typeof test.test !== 'function') {
        throw new Error(`Test "${test.name}" is missing a valid test function property`);
      }
      if (typeof test.weight !== 'number' || test.weight <= 0) {
        throw new Error(`Test "${test.name}" must have a positive numeric weight property`);
      }
    });
    
    return testFunctions;
  } catch (error) {
    console.error('Error parsing custom tests:', error);
    showToast('Error parsing custom tests: ' + error.message, 'error');
    return null;
  }
}

// Run custom tests on the user iframe
async function runCustomTests() {
  // Show loading on button
  const customTestButton = document.getElementById('run-custom-tests-btn');
  if (customTestButton) {
    customTestButton.textContent = 'Running Tests...';
    customTestButton.disabled = true;
  }
  
  try {
    const userOutputFrame = document.getElementById('user-output');
    if (!userOutputFrame || !userOutputFrame.contentDocument) {
      showToast('User output frame not found or not loaded. Run your code first.', 'error');
      return;
    }
    
    const tests = parseCustomTests();
    if (!tests) {
      return; // Error already shown
    }
    
    const userDoc = userOutputFrame.contentDocument;
    
    // Create or get test results container
    let resultsContainer = document.getElementById('custom-test-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'custom-test-results';
      resultsContainer.className = 'test-results-container';
      
      // Add it after the custom tests section
      const customTestsSection = document.getElementById('custom-tests-section');
      customTestsSection.appendChild(resultsContainer);
    }
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'test-results-header';
    header.innerHTML = '<span>Custom Test Results</span>';
    resultsContainer.appendChild(header);
    
    // Run each test
    let totalScore = 0;
    let totalWeight = 0;
    let testResults = [];
    
    for (const test of tests) {
      const result = {
        name: test.name,
        weight: test.weight,
        passed: false
      };
      
      try {
        // Run the test with the user's document
        result.passed = test.test(userDoc);
        
        // Add to score if passed
        if (result.passed) {
          totalScore += test.weight;
        }
        
        totalWeight += test.weight;
      } catch (error) {
        console.error(`Error running test "${test.name}":`, error);
        result.error = error.message;
        result.passed = false;
      }
      
      testResults.push(result);
      
      // Create result item
      const resultItem = document.createElement('div');
      resultItem.className = `test-result-item ${result.passed ? 'success' : 'failure'}`;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'test-name';
      nameSpan.textContent = test.name;
      
      const weightSpan = document.createElement('span');
      weightSpan.className = 'test-weight';
      weightSpan.textContent = `(${test.weight} points)`;
      
      const statusSpan = document.createElement('span');
      statusSpan.className = `test-status ${result.passed ? 'success' : 'failure'}`;
      statusSpan.textContent = result.passed ? 'PASSED' : 'FAILED';
      
      resultItem.appendChild(nameSpan);
      nameSpan.appendChild(weightSpan);
      resultItem.appendChild(statusSpan);
      
      resultsContainer.appendChild(resultItem);
    }
    
    // Calculate and display final score
    const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    
    // Create score summary
    const scoreSummary = document.createElement('div');
    scoreSummary.className = 'test-result-item';
    scoreSummary.style.marginTop = '15px';
    scoreSummary.style.fontWeight = 'bold';
    scoreSummary.innerHTML = `
      <span>Final Custom Test Score:</span>
      <span>${totalScore} / ${totalWeight} (${finalScore}%)</span>
    `;
    resultsContainer.appendChild(scoreSummary);
    
    // Show results by expanding the section if collapsed
    const customTestsSection = document.getElementById('custom-tests-section');
    if (customTestsSection.classList.contains('collapsed')) {
      const toggleBtn = document.querySelector('[data-target="custom-tests-section"]');
      if (toggleBtn) toggleBtn.click();
    }
    
    // Set functional score if used in place of the default testing
    const useCustomScoreCheckbox = document.getElementById('use-custom-tests-score');
    if (useCustomScoreCheckbox && useCustomScoreCheckbox.checked) {
      functionalScoreElement.textContent = finalScore + '%';
      applyScoreColor(functionalScoreElement, finalScore);
      
      // Recalculate total score
      const visualScore = parseInt(visualScoreElement.textContent, 10) || 0;
      const totalScore = Math.round(visualScore * 0.4 + finalScore * 0.6);
      totalScoreElement.textContent = totalScore + '%';
      applyScoreColor(totalScoreElement, totalScore);
    }
    
    showToast(`Custom tests completed: ${finalScore}% score`);
    
  } catch (error) {
    console.error('Error running custom tests:', error);
    showToast('Error running custom tests: ' + error.message, 'error');
  } finally {
    // Restore button state
    if (customTestButton) {
      customTestButton.textContent = 'Run Custom Tests';
      customTestButton.disabled = false;
    }
  }
}

// Apply color to score element based on value
function applyScoreColor(element, score) {
  if (score >= 80) {
    element.style.color = '#2ecc71';
  } else if (score >= 60) {
    element.style.color = '#f39c12';
  } else {
    element.style.color = '#e74c3c';
  }
}

// Initialize the application
function initialize() {
  // Populate editors with sample code
  populateEditors();
  
  // Setup collapsible sections
  setupToggleButtons();
  
  // Setup tooltips
  setupTooltips();
  
  // Load custom tests
  loadCustomTests();
  
  // Ensure all DOM elements are ready
  const diffCanvasElement = document.getElementById('diff-canvas');
  if (diffCanvasElement) {
    window.diffCanvas = diffCanvasElement; // Make it globally available
  } else {
    console.warn('Diff canvas element not found in the DOM');
  }
  
  // Check if we should use custom tests
  const useCustomScoreCheckbox = document.getElementById('use-custom-tests-score');
  if (useCustomScoreCheckbox) {
    // Load saved preference from localStorage if available
    const savedPreference = localStorage.getItem('useCustomTests');
    if (savedPreference !== null) {
      useCustomScoreCheckbox.checked = savedPreference === 'true';
    }
    
    // Save preference when changed
    useCustomScoreCheckbox.addEventListener('change', function() {
      localStorage.setItem('useCustomTests', this.checked);
    });
  }
  
  // Load the solution code into the expected output iframe
  setTimeout(updateSolutionCode, 1000);
  
  // Run user code automatically for convenience
  setTimeout(runUserCode, 1500);
  
  // Set up event listeners
  const runButton = document.getElementById('run-btn');
  const testButton = document.getElementById('test-btn');
  const updateSolutionButton = document.getElementById('update-solution-btn');
  const saveTestsButton = document.getElementById('save-tests-btn');
  const runCustomTestsButton = document.getElementById('run-custom-tests-btn');
  
  if (runButton) runButton.addEventListener('click', runUserCode);
  if (testButton) testButton.addEventListener('click', runVisualTest);
  if (updateSolutionButton) updateSolutionButton.addEventListener('click', updateSolutionCode);
  if (saveTestsButton) saveTestsButton.addEventListener('click', saveCustomTests);
  if (runCustomTestsButton) runCustomTestsButton.addEventListener('click', runCustomTests);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize); 