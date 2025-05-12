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
    
    // Functional test (now non-visible)
    const functionalScore = await testE2EFunctionality();
    console.log('Functional test score:', functionalScore + '%');
    
    // Calculate total score (40% visual, 60% functional)
    const totalScore = Math.round(visualScore * 0.4 + functionalScore * 0.6);
    console.log('Total score:', totalScore + '%');
    
    // Update score displays
    updateScoreDisplay(visualScore, functionalScore, totalScore);
    
    console.log('Visual regression test completed successfully');
    showToast('Testing completed successfully');
    
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

// Helper function to update score display
function updateScoreDisplay(visualScore, functionalScore, totalScore) {
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
    // Create deep clones of the iframe bodies to avoid affecting the original DOM
    const userClone = userOutput.cloneNode(true);
    const expectedClone = expectedOutput.cloneNode(true);
    
    // Give the clones the same styling as their original bodies
    const userStyles = window.getComputedStyle(userOutput);
    const expectedStyles = window.getComputedStyle(expectedOutput);
    
    userClone.style.width = userStyles.width;
    userClone.style.height = userStyles.height;
    userClone.style.overflow = 'hidden';
    
    expectedClone.style.width = expectedStyles.width;
    expectedClone.style.height = expectedStyles.height;
    expectedClone.style.overflow = 'hidden';
    
    // Capture from the clones to avoid any flickering
    const userCanvas = await html2canvas(userOutput, {
      logging: false, 
      useCORS: true, 
      allowTaint: true,
      backgroundColor: null,
      removeContainer: true
    });
    
    const expectedCanvas = await html2canvas(expectedOutput, {
      logging: false, 
      useCORS: true, 
      allowTaint: true,
      backgroundColor: null,
      removeContainer: true
    });
    
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
  
  // Get or create diff canvas
  let diffContext;
  if (diffCanvas) {
    diffCanvas.width = width;
    diffCanvas.height = height;
    diffContext = diffCanvas.getContext('2d');
  } else {
    // If diffCanvas is not available, create a temporary one
    console.warn("Diff canvas not found in DOM, creating temporary canvas");
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    diffContext = tempCanvas.getContext('2d');
  }
  
  // First, draw a side-by-side comparison
  diffContext.fillStyle = "#f0f0f0";
  diffContext.fillRect(0, 0, width, height);
  
  // Draw the user and expected output separately first
  diffContext.drawImage(userCanvas, 0, 0, width/2, height);
  diffContext.drawImage(expectedCanvas, width/2, 0, width/2, height);
  
  // Add labels
  diffContext.font = "14px Arial";
  diffContext.fillStyle = "#000";
  diffContext.fillText("User Output", 10, 20);
  diffContext.fillText("Expected Output", width/2 + 10, 20);
  
  // Draw a separator line
  diffContext.strokeStyle = "#000";
  diffContext.beginPath();
  diffContext.moveTo(width/2, 0);
  diffContext.lineTo(width/2, height);
  diffContext.stroke();
  
  // Now create a diff image below
  const diffHeight = Math.min(height, 300); // Limit diff height
  diffCanvas.height = height + diffHeight + 30; // Add space for label

  
  // Create the actual diff image
  const diffImageData = diffContext.createImageData(width, diffHeight);
  
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
  
  // Custom diff color options with clearly distinguishable colors
  const diffOptions = {
    threshold: 0.1,
    includeAA: true,
    alpha: 0.5,
    diffColor: [255, 0, 0],      // Red for differences
    diffColorAlt: [0, 0, 255],   // Blue for missing in user output
    diffMask: true
  };
  
  // Compare the images
  const mismatchedPixels = pixelmatch(
    userImageData.data,
    expectedImageData.data,
    diffImageData.data,
    width,
    diffHeight,
    diffOptions
  );
  
  // Draw diff image at the bottom part of the canvas
  diffContext.putImageData(diffImageData, 0, height + 30);
  
  // Add color legend
  diffContext.fillStyle = "rgba(255, 0, 0, 0.7)";
  diffContext.fillRect(width - 140, height + 5, 15, 15);
  diffContext.fillStyle = "rgba(0, 0, 255, 0.7)";
  diffContext.fillRect(width - 140, height + 25, 15, 15);
  diffContext.fillStyle = "#000";
  diffContext.fillText("Differences", width - 120, height + 15);
  diffContext.fillText("Missing Content", width - 120, height + 35);
  
  // Calculate mismatch percentage
  const totalPixels = width * diffHeight;
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

// Initialize the application
function initialize() {
  // Populate editors with sample code
  populateEditors();
  
  // Setup collapsible sections
  setupToggleButtons();
  
  // Setup tooltips
  setupTooltips();
  
  // Ensure all DOM elements are ready
  const diffCanvasElement = document.getElementById('diff-canvas');
  if (diffCanvasElement) {
    window.diffCanvas = diffCanvasElement; // Make it globally available
  } else {
    console.warn('Diff canvas element not found in the DOM');
  }
  
  // Load the solution code into the expected output iframe
  setTimeout(updateSolutionCode, 1000);
  
  // Run user code automatically for convenience
  setTimeout(runUserCode, 1500);
  
  // Set up event listeners
  const runButton = document.getElementById('run-btn');
  const testButton = document.getElementById('test-btn');
  const updateSolutionButton = document.getElementById('update-solution-btn');
  
  if (runButton) runButton.addEventListener('click', runUserCode);
  if (testButton) testButton.addEventListener('click', runVisualTest);
  if (updateSolutionButton) updateSolutionButton.addEventListener('click', updateSolutionCode);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize); 