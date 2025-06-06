import html2canvas from 'html2canvas';
import pixelmatch from 'pixelmatch';
import ResembleJS from 'resemblejs';

// Responsive viewport dimensions for testing
const RESPONSIVE_VIEWPORTS = [
  { name: 'Mobile', width: 360, height: 640 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
];

// DOM elements
const htmlEditor = document.getElementById('html-editor');
const cssEditor = document.getElementById('css-editor');
const jsEditor = document.getElementById('js-editor');
const runButton = document.getElementById('run-btn');
const testButton = document.getElementById('test-btn');
const runAllButton = document.getElementById('run-all-btn');
const displayOutputsButton = document.getElementById('display-outputs-btn');

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
const layoutScoreElement = document.getElementById('layout-score');
const totalScoreElement = document.getElementById('total-score');
const diffCanvas = document.getElementById('diff-canvas');
const layoutDiffCanvas = document.getElementById('layout-diff-canvas');

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
    test: function (doc) {
      return doc.getElementById('todo-list') !== null;
    },
    weight: 10
  },
  {
    name: 'Add button exists',
    test: function (doc) {
      return doc.getElementById('add-button') !== null;
    },
    weight: 10
  },
  {
    name: 'Can add a new item',
    test: function (doc) {
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
    test: function (doc) {
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
saveTestsButton.addEventListener('click', saveCustomTests);
runCustomTestsButton.addEventListener('click', runCustomTests);
runAllButton.addEventListener('click', runAllTests);
displayOutputsButton.addEventListener('click', displayViewportOutputs);

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

    // Also update the second user iframe with transformed CSS
    const userOutputFrame2 = document.getElementById('user-output-2');
    if (userOutputFrame2) {
      const transformedCSS = transformCSS(css);
      const layoutHtml = createFullHtml(html, transformedCSS, js);
      userOutputFrame2.srcdoc = layoutHtml;
      console.log('User layout code updated with transformed CSS');
    }

    console.log('User code executed successfully');
    showToast('Code executed successfully');
  } catch (error) {
    console.error('Error running user code:', error);
    showToast('Error running code: ' + error.message, 'error');
  }
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

    // Also update the second expected iframe with transformed CSS
    const expectedOutputFrame2 = document.getElementById('expected-output-2');
    if (expectedOutputFrame2) {
      const transformedCSS = transformCSS(css);
      const layoutHtml = createFullHtml(html, transformedCSS, js);
      expectedOutputFrame2.srcdoc = layoutHtml;
      console.log('Solution layout code updated with transformed CSS');
    }

    console.log('Solution code updated successfully');
    showToast('Solution code updated successfully');
  } catch (error) {
    console.error('Error updating solution code:', error);
    showToast('Error updating solution code: ' + error.message, 'error');
  }
}

// Transform CSS function to convert colors for layout comparison
function transformCSS(inputCSS) {
    // Define regex patterns for background and non-background properties
    const backgroundProps = /^background(?:-color|)$/i;
    const colorProps = /^(?:color|border(?:-(?:top|right|bottom|left)-color|)|box-shadow|text-shadow|outline(?:-color|)|fill|stroke)$/i;

    // Normalize whitespace and format CSS properties
    inputCSS = inputCSS.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ');

    // Updated regex to match all CSS selectors including classes (.), IDs (#), and complex selectors
    const ruleRegex = /([^{]+)\s*{([^}]+)}/g;
    let resultCSS = '';

    // Function to detect and replace color values in a property value
    function replaceColorsInValue(value, targetColor) {
        // Color patterns to match
        const colorPatterns = [
            // Hex colors (#fff, #ffffff, #fff0, #ffffff00)
            /#[0-9a-fA-F]{3,8}\b/g,
            // RGB/RGBA colors
            /rgba?\([^)]+\)/gi,
            // HSL/HSLA colors
            /hsla?\([^)]+\)/gi,
            // Named colors - comprehensive list of CSS color keywords
            /\b(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgrey|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|grey|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgrey|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|transparent)\b/gi
        ];

        let modifiedValue = value;
        
        // Replace each color pattern found in the value
        colorPatterns.forEach(pattern => {
            modifiedValue = modifiedValue.replace(pattern, targetColor);
        });

        return modifiedValue;
    }

    let match;
    while ((match = ruleRegex.exec(inputCSS)) !== null) {
        const selector = match[1].trim();
        let declarations = match[2].trim();

        // Split the declarations by semicolon and process them
        let processedDeclarations = declarations.split(';').map(declaration => {
            // Trim the individual declaration
            declaration = declaration.trim();
            if (!declaration) return '';
            
            const colonIndex = declaration.indexOf(':');
            if (colonIndex === -1) return declaration; // Invalid declaration, keep as is
            
            const property = declaration.substring(0, colonIndex).trim();
            const value = declaration.substring(colonIndex + 1).trim();

            // Normalize the property to lowercase for easy matching
            const propertyLower = property.toLowerCase();

            // Check if it's a background property
            if (backgroundProps.test(propertyLower)) {
                // Replace colors with white for background properties
                const newValue = replaceColorsInValue(value, 'white');
                return `${property}: ${newValue}`;
            }
            // Check if it's a color-related property
            else if (colorProps.test(propertyLower)) {
                // Replace colors with black for color properties
                const newValue = replaceColorsInValue(value, 'black');
                return `${property}: ${newValue}`;
            }
            // Special handling for shorthand properties that can contain colors
            else if (/^border(?:-(?:top|right|bottom|left)|)$/i.test(propertyLower)) {
                // Border shorthand: border: 1px solid red
                const newValue = replaceColorsInValue(value, 'black');
                return `${property}: ${newValue}`;
            }
            else if (/^outline$/i.test(propertyLower)) {
                // Outline shorthand: outline: 2px solid blue
                const newValue = replaceColorsInValue(value, 'black');
                return `${property}: ${newValue}`;
            }
            else if (/^background$/i.test(propertyLower)) {
                // Background shorthand: background: url() center red
                const newValue = replaceColorsInValue(value, 'white');
                return `${property}: ${newValue}`;
            }

            // If none of the above, leave the property as is
            return `${property}: ${value}`;
        }).filter(Boolean).join('; ');

        // Add the transformed rule to the result
        resultCSS += `${selector} { ${processedDeclarations} }\n`;
    }

    return resultCSS.trim();
}

// Run user layout code and display it in the second iframe
function runUserLayoutCode() {
  const userOutputFrame2 = document.getElementById('user-output-2');
  if (!userOutputFrame2) {
    console.error('User output iframe 2 not found');
    return;
  }

  try {
    const html = htmlEditor.value;
    const css = cssEditor.value;
    const js = jsEditor.value;

    // Transform the CSS using the transformCSS function
    const transformedCSS = transformCSS(css);

    // Create a complete HTML document with transformed CSS and image placeholders for layout
    const fullHtml = createFullHtml(html, transformedCSS, js, true);

    // Set the HTML content using srcdoc
    userOutputFrame2.srcdoc = fullHtml;

    console.log('User layout code executed successfully with transformed CSS and image placeholders');
  } catch (error) {
    console.error('Error running user layout code:', error);
  }
}

// Load solution layout code into the second expected output iframe
function updateSolutionLayoutCode() {
  const expectedOutputFrame2 = document.getElementById('expected-output-2');
  if (!expectedOutputFrame2) {
    console.error('Expected output iframe 2 not found');
    return;
  }

  try {
    const html = solutionHtmlEditor.value;
    const css = solutionCssEditor.value;
    const js = solutionJsEditor.value;

    // Transform the CSS using the transformCSS function
    const transformedCSS = transformCSS(css);

    // Create a complete HTML document with transformed CSS and image placeholders for layout
    const fullHtml = createFullHtml(html, transformedCSS, js, true);

    // Set the HTML content using srcdoc
    expectedOutputFrame2.srcdoc = fullHtml;

    console.log('Solution layout code updated successfully with transformed CSS and image placeholders');
  } catch (error) {
    console.error('Error updating solution layout code:', error);
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
  if (testButton) {
    testButton.classList.add('loading');
    testButton.disabled = true;
  }

  try {
    console.log('Starting responsive visual regression test...');
    showToast('Running responsive visual test...', 'success');

    // Clear previous results
    if (visualScoreElement) visualScoreElement.textContent = '-';
    if (totalScoreElement) totalScoreElement.textContent = '-';

    const userOutputFrame = document.getElementById('user-output');
    const expectedOutputFrame = document.getElementById('expected-output');

    if (!userOutputFrame || !expectedOutputFrame) {
      showToast('Output frames not found. Please reload the page.', 'error');
      return;
    }

    if (!userOutputFrame.contentDocument || !userOutputFrame.contentDocument.body) {
      showToast('Please run your code first before testing', 'error');
      return;
    }

    // Run responsive visual comparison
    const visualResults = await runResponsiveVisualComparison();
    const visualScore = visualResults.overallScore;

    console.log('Responsive visual test completed with score:', visualScore + '%');

    // Update visual score display
    visualScoreElement.textContent = visualScore + '%';
    applyScoreColor(visualScoreElement, visualScore);

    // Store results for potential use
    window.lastVisualResults = visualResults;

    // Create detailed results display FIRST
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
      // Remove any existing visual test results
      const existingResults = document.getElementById('visual-test-results');
      if (existingResults) {
        existingResults.remove();
      }

      // Create new results section
      const visualResultsSection = document.createElement('div');
      visualResultsSection.id = 'visual-test-results';
      visualResultsSection.className = 'test-results-container';
      visualResultsSection.style.marginTop = '20px';
      visualResultsSection.style.marginBottom = '20px';
      visualResultsSection.style.border = '2px solid #3498db';
      visualResultsSection.style.borderRadius = '8px';
      visualResultsSection.style.padding = '15px';
      visualResultsSection.style.backgroundColor = '#f8f9fa';

      // Insert after the score display
      const scoreDisplay = resultsContainer.querySelector('.score-display');
      if (scoreDisplay) {
        scoreDisplay.insertAdjacentElement('afterend', visualResultsSection);
      } else {
        resultsContainer.appendChild(visualResultsSection);
      }

      // Header
      const header = document.createElement('div');
      header.innerHTML = '<span>👁️ Responsive Visual Test Results</span>';
      header.style.fontSize = '18px';
      header.style.fontWeight = 'bold';
      header.style.color = '#2c3e50';
      header.style.marginBottom = '15px';
      visualResultsSection.appendChild(header);

      // Overall score
      const overallScore = document.createElement('div');
      overallScore.style.textAlign = 'center';
      overallScore.style.marginBottom = '15px';
      overallScore.style.padding = '10px';
      overallScore.style.backgroundColor = '#2c3e50';
      overallScore.style.color = 'white';
      overallScore.style.borderRadius = '6px';
      overallScore.style.fontSize = '16px';
      overallScore.style.fontWeight = 'bold';
      overallScore.innerHTML = `Overall Visual Score: ${visualScore}%`;
      visualResultsSection.appendChild(overallScore);

      // Viewport breakdown
      if (visualResults.viewportScores && visualResults.viewportScores.length > 0) {
        const breakdownHeader = document.createElement('h4');
        breakdownHeader.textContent = 'Scores by Viewport:';
        breakdownHeader.style.margin = '15px 0 10px 0';
        breakdownHeader.style.color = '#34495e';
        visualResultsSection.appendChild(breakdownHeader);

        const viewportGrid = document.createElement('div');
        viewportGrid.style.display = 'grid';
        viewportGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        viewportGrid.style.gap = '10px';

        visualResults.viewportScores.forEach(score => {
          const viewportItem = document.createElement('div');
          viewportItem.style.padding = '10px';
          viewportItem.style.backgroundColor = 'white';
          viewportItem.style.borderRadius = '6px';
          viewportItem.style.border = '1px solid #ddd';

          const viewportName = document.createElement('div');
          viewportName.textContent = score.viewport;
          viewportName.style.fontWeight = 'bold';
          viewportName.style.marginBottom = '8px';

          const scoreDetails = document.createElement('div');
          scoreDetails.style.fontSize = '12px';
          scoreDetails.style.color = '#666';
          scoreDetails.innerHTML = `
            PixelMatch: ${score.pixelMatchScore}%<br>
            ResembleJS: ${score.resembleScore}%<br>
            <strong>Average: ${score.averageScore}%</strong>
          `;

          viewportItem.appendChild(viewportName);
          viewportItem.appendChild(scoreDetails);
          viewportGrid.appendChild(viewportItem);
        });

        visualResultsSection.appendChild(viewportGrid);
      }
    }

    // Generate Desktop-only diff visualization AFTER responsive comparison
    console.log('Generating Desktop visual diff visualization...');
    const desktopViewport = { name: 'Desktop', width: 1280, height: 720 };
    
    try {
      const userCanvas = await captureScreenshotAtViewport(userOutputFrame, desktopViewport);
      const expectedCanvas = await captureScreenshotAtViewport(expectedOutputFrame, desktopViewport);
      
      // Generate diff visualization
      const diffCanvas = document.getElementById('diff-canvas');
      if (diffCanvas && userCanvas && expectedCanvas) {
        // Set canvas size to match Desktop viewport - THIS HAPPENS LAST
        diffCanvas.width = desktopViewport.width;
        diffCanvas.height = desktopViewport.height + 80; // Extra space for header
        
        const ctx = diffCanvas.getContext('2d');
        
        // Clear canvas with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, diffCanvas.width, diffCanvas.height);
        
        // Draw header
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Visual Difference (Desktop 1280×720)', diffCanvas.width / 2, 25);
        
        // Draw legend
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('■ Different pixels', 20, 50);
        ctx.fillStyle = '#3498db';
        ctx.fillText('■ Missing elements', 150, 50);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('■ Matching areas', 280, 50);
        
        // Draw faded original image
        ctx.globalAlpha = 0.3;
        ctx.drawImage(expectedCanvas, 0, 80, desktopViewport.width, desktopViewport.height);
        ctx.globalAlpha = 1.0;
        
        // Create and draw diff
        const diffImageData = ctx.createImageData(desktopViewport.width, desktopViewport.height);
        const userImageData = userCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
        const expectedImageData = expectedCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
        
        // Use PixelMatch to generate diff
        const pixelmatch = (await import('pixelmatch')).default;
        const diffPixels = pixelmatch(
          userImageData.data,
          expectedImageData.data,
          diffImageData.data,
          desktopViewport.width,
          desktopViewport.height,
          { threshold: 0.1, alpha: 0.8 }
        );
        
        // Draw diff overlay
        ctx.putImageData(diffImageData, 0, 80);
        
        console.log(`Desktop visual diff visualization generated successfully with ${diffPixels} different pixels`);
      }
    } catch (diffError) {
      console.error('Error generating visual diff visualization:', diffError);
    }

    console.log('Visual regression test completed successfully');
    showToast(`Visual test completed! Score: ${visualScore}%`, 'success');

  } catch (error) {
    console.error('Error in visual regression test:', error);
    showToast('Error running visual test: ' + error.message, 'error');
    
    // Update visual score display with error
    if (visualScoreElement) {
      visualScoreElement.textContent = 'Error';
      visualScoreElement.style.color = '#e74c3c';
    }
  } finally {
    // Remove loading state regardless of outcome
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
function createFullHtml(html, css, js, forLayout = false) {
  // Extract body content from HTML if it exists
  let bodyContent = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    bodyContent = bodyMatch[1];
  }

  // If this is for layout comparison, replace all images with black and white placeholders
  if (forLayout) {
    bodyContent = replaceImagesForLayout(bodyContent);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${css}</style>
      ${forLayout ? `
      <style>
        /* Layout comparison styles for image placeholders */
        .layout-image-placeholder {
          background: #000;
          border: 2px solid #000;
          display: inline-block;
          min-width: 100px;
          min-height: 100px;
          position: relative;
          vertical-align: top;
        }
        .layout-image-placeholder::after {
          content: 'IMG';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          color: #000;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #000;
        }
      </style>
      ` : ''}
    </head>
    <body>
      ${bodyContent}
      <script>${js}</script>
    </body>
    </html>
  `;
}

// Function to replace images with black and white placeholders for layout comparison
function replaceImagesForLayout(html) {
  // Replace img tags with black and white placeholder spans
  return html.replace(/<img[^>]*>/gi, (match) => {
    // Extract width and height attributes if they exist
    const widthMatch = match.match(/width\s*=\s*["']?(\d+)["']?/i);
    const heightMatch = match.match(/height\s*=\s*["']?(\d+)["']?/i);
    const classMatch = match.match(/class\s*=\s*["']([^"']*)["']/i);
    const idMatch = match.match(/id\s*=\s*["']([^"']*)["']/i);
    const styleMatch = match.match(/style\s*=\s*["']([^"']*)["']/i);
    
    let width = widthMatch ? widthMatch[1] + 'px' : '100px';
    let height = heightMatch ? heightMatch[1] + 'px' : '100px';
    let className = classMatch ? classMatch[1] : '';
    let id = idMatch ? idMatch[1] : '';
    let style = styleMatch ? styleMatch[1] : '';
    
    // Combine existing style with placeholder dimensions
    const combinedStyle = `width: ${width}; height: ${height}; ${style}`;
    
    return `<span class="layout-image-placeholder ${className}" ${id ? `id="${id}"` : ''} style="${combinedStyle}"></span>`;
  });
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
function compareWithPixelMatch(userCanvas, expectedCanvas, preserveCanvasDimensions = false) {
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
      // Only resize canvas if not preserving dimensions (for responsive mode)
      if (!preserveCanvasDimensions) {
        diffCanvas.width = targetWidth;
        diffCanvas.height = targetHeight + 80; // Add space for header and legend
      }
      diffContext = diffCanvas.getContext('2d');
      console.log("Using existing diff canvas");
    } else {
      console.warn("Diff canvas not found in DOM, creating temporary canvas");
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight + 80;
      diffContext = tempCanvas.getContext('2d');
    }

    // For preserved dimensions, don't clear or redraw headers
    if (!preserveCanvasDimensions) {
      // Clear the canvas with background color
      diffContext.fillStyle = "#ffffff";
      diffContext.fillRect(0, 0, targetWidth, targetHeight + 80);

      // Add header text
      diffContext.font = "bold 14px Arial";
      diffContext.fillStyle = "#333";
      diffContext.textAlign = "left";
      diffContext.fillText("Layout Differences (Content-Only Comparison)", 10, 30);

      // Add color legend
      diffContext.font = "11px Arial";
      diffContext.fillStyle = "#666";
      diffContext.fillText("Grey: Matching • Red: User only • Blue: Expected only • Purple: Different", 10, 50);
    }

    // Create a simple comparison
    console.log("Preparing image data for comparison...");

    // Create image data from both canvases
    const userImageData = userCanvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    const expectedImageData = expectedCanvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    const diffImageData = diffContext.createImageData(targetWidth, targetHeight);

    // Custom pixel comparison that ignores white pixels
    console.log("Running content-only pixel comparison...");
    let mismatchedPixels = 0;
    let contentPixels = 0; // Count of non-white pixels to compare

    const userData = userImageData.data;
    const expectedData = expectedImageData.data;
    const diffData = diffImageData.data;

    for (let i = 0; i < userData.length; i += 4) {
      const userR = userData[i];
      const userG = userData[i + 1];
      const userB = userData[i + 2];
      const userA = userData[i + 3];

      const expectedR = expectedData[i];
      const expectedG = expectedData[i + 1];
      const expectedB = expectedData[i + 2];
      const expectedA = expectedData[i + 3];

      // Check if either pixel is non-white (content)
      const userIsContent = !(userR >= 250 && userG >= 250 && userB >= 250);
      const expectedIsContent = !(expectedR >= 250 && expectedG >= 250 && expectedB >= 250);

      // If either pixel has content, we need to compare it
      if (userIsContent || expectedIsContent) {
        contentPixels++;

        // Check if the pixels are different
        const rDiff = Math.abs(userR - expectedR);
        const gDiff = Math.abs(userG - expectedG);
        const bDiff = Math.abs(userB - expectedB);
        const aDiff = Math.abs(userA - expectedA);

        // Use a threshold for difference detection
        const threshold = 15; // Adjust as needed
        const isDifferent = rDiff > threshold || gDiff > threshold || bDiff > threshold || aDiff > threshold;

        if (isDifferent) {
          mismatchedPixels++;
          
          // Color the diff pixel red for user differences, blue for expected differences
          if (userIsContent && !expectedIsContent) {
            // User has content where expected doesn't - red
            diffData[i] = 231;     // Red
            diffData[i + 1] = 76;  // Green
            diffData[i + 2] = 60;  // Blue
            diffData[i + 3] = 200; // Alpha
          } else if (!userIsContent && expectedIsContent) {
            // Expected has content where user doesn't - blue
            diffData[i] = 52;      // Red
            diffData[i + 1] = 152; // Green
            diffData[i + 2] = 219; // Blue
            diffData[i + 3] = 200; // Alpha
          } else {
            // Both have content but different - purple
            diffData[i] = 155;     // Red
            diffData[i + 1] = 89;  // Green
            diffData[i + 2] = 182; // Blue
            diffData[i + 3] = 200; // Alpha
          }
        } else {
          // Content matches - show grey to indicate matching/overlapping areas
          diffData[i] = 128;     // Grey
          diffData[i + 1] = 128; // Grey
          diffData[i + 2] = 128; // Grey
          diffData[i + 3] = 150; // Semi-transparent
        }
      } else {
        // Both pixels are white (background), make transparent in diff
        diffData[i] = 0;
        diffData[i + 1] = 0;
        diffData[i + 2] = 0;
        diffData[i + 3] = 0;
      }
    }

    console.log(`Content-only comparison complete. Found ${mismatchedPixels} mismatched content pixels out of ${contentPixels} total content pixels.`);

    // First draw a very faded version of the original for context
    diffContext.globalAlpha = 0.2;
    diffContext.drawImage(userCanvas, 0, 0, targetWidth, targetHeight, 0, 80, targetWidth, targetHeight);
    diffContext.globalAlpha = 1.0;

    // Draw the diff data
    console.log("Drawing diff visualization...");
    diffContext.putImageData(diffImageData, 0, 80);

    // Calculate mismatch percentage based only on content pixels
    let matchPercentage = 100;
    let percentageMismatch = 0;

    if (contentPixels > 0) {
      matchPercentage = 100 - (mismatchedPixels / contentPixels * 100);
      percentageMismatch = (mismatchedPixels / contentPixels * 100).toFixed(2);
    } else {
      // No content pixels found, treat as 100% match
      console.log("No content pixels found for comparison");
    }

    // Add info about detected differences
    diffContext.font = "12px Arial";
    diffContext.fillStyle = "#666";
    diffContext.textAlign = "right";
    diffContext.fillText(`Content differences: ${mismatchedPixels}/${contentPixels} pixels (${percentageMismatch}%)`, targetWidth - 10, 30);

    console.log("Content-only visual comparison completed successfully");
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
  // Initialize with sample Todo app code
  initializeSampleCode();
  
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

  const layoutDiffCanvasElement = document.getElementById('layout-diff-canvas');
  if (layoutDiffCanvasElement) {
    window.layoutDiffCanvas = layoutDiffCanvasElement; // Make it globally available
  } else {
    console.warn('Layout diff canvas element not found in the DOM');
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
    useCustomScoreCheckbox.addEventListener('change', function () {
      localStorage.setItem('useCustomTests', this.checked);
    });
  }

  // Load the solution code into the expected output iframe
  setTimeout(updateSolutionCode, 1000);

  // Run user code automatically for convenience
  setTimeout(runUserCode, 1500);

  // Load the solution layout code into the second expected output iframe
  setTimeout(updateSolutionLayoutCode, 2000);

  // Run user layout code automatically for convenience
  setTimeout(runUserLayoutCode, 2500);

  // Set up event listeners
  const runButton = document.getElementById('run-btn');
  const testButton = document.getElementById('test-btn');
  const layoutCompareButton = document.getElementById('layout-compare-btn');
  const runAllButton = document.getElementById('run-all-btn');
  const updateSolutionButton = document.getElementById('update-solution-btn');
  const saveTestsButton = document.getElementById('save-tests-btn');
  const runCustomTestsButton = document.getElementById('run-custom-tests-btn');
  const displayOutputsButton = document.getElementById('display-outputs-btn');
  const generateViewportDiffsButton = document.getElementById('generate-viewport-diffs-btn');

  if (runButton) runButton.addEventListener('click', runUserCode);
  if (testButton) testButton.addEventListener('click', runVisualTest);
  if (layoutCompareButton) layoutCompareButton.addEventListener('click', runLayoutCompareTest);
  if (runAllButton) runAllButton.addEventListener('click', runAllTests);
  if (updateSolutionButton) updateSolutionButton.addEventListener('click', updateSolutionCode);
  if (saveTestsButton) saveTestsButton.addEventListener('click', saveCustomTests);
  if (runCustomTestsButton) runCustomTestsButton.addEventListener('click', runCustomTests);
  if (displayOutputsButton) displayOutputsButton.addEventListener('click', displayViewportOutputs);
  if (generateViewportDiffsButton) generateViewportDiffsButton.addEventListener('click', generateAllViewportDiffs);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);

// Run layout comparison test
async function runLayoutCompareTest() {
  try {
    console.log('Starting responsive layout comparison test...');
    showToast('Running responsive layout comparison...', 'success');

    // Clear previous layout results
    if (layoutScoreElement) layoutScoreElement.textContent = '-';

    // Clear any existing layout test results
    const existingLayoutResults = document.getElementById('layout-comparison-results');
    if (existingLayoutResults) {
      existingLayoutResults.remove();
    }

    // Run responsive layout comparison
    const layoutResults = await runResponsiveLayoutComparison();
    const layoutScore = layoutResults.overallScore;

    console.log('Responsive layout test completed with score:', layoutScore + '%');

    // Update layout score display
    layoutScoreElement.textContent = layoutScore + '%';
    applyScoreColor(layoutScoreElement, layoutScore);

    // Store results for potential use
    window.lastLayoutResults = layoutResults;

    // Create detailed results display FIRST
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
      // Remove any existing layout test results
      const existingLayoutResults = document.getElementById('layout-comparison-results');
      if (existingLayoutResults) {
        existingLayoutResults.remove();
      }

      // Create new layout results section
      const layoutResultsSection = document.createElement('div');
      layoutResultsSection.id = 'layout-comparison-results';
      layoutResultsSection.className = 'test-results-container';
      layoutResultsSection.style.marginTop = '20px';
      layoutResultsSection.style.marginBottom = '20px';
      layoutResultsSection.style.border = '2px solid #9b59b6';
      layoutResultsSection.style.borderRadius = '8px';
      layoutResultsSection.style.padding = '15px';
      layoutResultsSection.style.backgroundColor = '#f8f9fa';

      // Insert after existing results
      const lastDiffContainer = resultsContainer.querySelector('.diff-container:last-child');
      if (lastDiffContainer) {
        lastDiffContainer.insertAdjacentElement('afterend', layoutResultsSection);
      } else {
        resultsContainer.appendChild(layoutResultsSection);
      }

      // Header
      const header = document.createElement('div');
      header.innerHTML = '<span>📐 Responsive Layout Comparison Results</span>';
      header.style.fontSize = '18px';
      header.style.fontWeight = 'bold';
      header.style.color = '#2c3e50';
      header.style.marginBottom = '15px';
      layoutResultsSection.appendChild(header);

      // Overall score
      const overallScore = document.createElement('div');
      overallScore.style.textAlign = 'center';
      overallScore.style.marginBottom = '15px';
      overallScore.style.padding = '10px';
      overallScore.style.backgroundColor = '#9b59b6';
      overallScore.style.color = 'white';
      overallScore.style.borderRadius = '6px';
      overallScore.style.fontSize = '16px';
      overallScore.style.fontWeight = 'bold';
      overallScore.innerHTML = `Overall Layout Score: ${layoutScore}%`;
      layoutResultsSection.appendChild(overallScore);

      // Viewport breakdown
      if (layoutResults.viewportScores && layoutResults.viewportScores.length > 0) {
        const breakdownHeader = document.createElement('h4');
        breakdownHeader.textContent = 'Layout Scores by Viewport:';
        breakdownHeader.style.margin = '15px 0 10px 0';
        breakdownHeader.style.color = '#34495e';
        layoutResultsSection.appendChild(breakdownHeader);

        const viewportGrid = document.createElement('div');
        viewportGrid.style.display = 'grid';
        viewportGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        viewportGrid.style.gap = '10px';
        viewportGrid.style.marginBottom = '15px';

        layoutResults.viewportScores.forEach(score => {
          const viewportItem = document.createElement('div');
          viewportItem.style.padding = '10px';
          viewportItem.style.backgroundColor = 'white';
          viewportItem.style.borderRadius = '6px';
          viewportItem.style.border = '1px solid #ddd';

          const viewportName = document.createElement('div');
          viewportName.textContent = score.viewport;
          viewportName.style.fontWeight = 'bold';
          viewportName.style.marginBottom = '5px';

          const avgScore = document.createElement('div');
          avgScore.textContent = `Average: ${score.averageScore}%`;
          avgScore.style.fontWeight = 'bold';
          applyScoreColor(avgScore, score.averageScore);

          const pixelScore = document.createElement('div');
          pixelScore.textContent = `PixelMatch: ${score.pixelMatchScore}%`;
          pixelScore.style.fontSize = '12px';
          pixelScore.style.color = '#666';

          const resembleScore = document.createElement('div');
          resembleScore.textContent = `ResembleJS: ${score.resembleScore}%`;
          resembleScore.style.fontSize = '12px';
          resembleScore.style.color = '#666';

          viewportItem.appendChild(viewportName);
          viewportItem.appendChild(avgScore);
          viewportItem.appendChild(pixelScore);
          viewportItem.appendChild(resembleScore);
          viewportGrid.appendChild(viewportItem);
        });

        layoutResultsSection.appendChild(viewportGrid);
      }

      // Explanation
      const explanation = document.createElement('div');
      explanation.style.fontSize = '14px';
      explanation.style.color = '#666';
      explanation.style.fontStyle = 'italic';
      explanation.style.marginTop = '15px';
      explanation.innerHTML = `
        <strong>Layout Testing:</strong> Evaluates structural positioning and element placement across different screen sizes. 
        This test normalizes colors to focus purely on layout differences, helping identify responsive design issues.
      `;
      layoutResultsSection.appendChild(explanation);
    }

    // Generate Desktop-only layout diff visualization AFTER responsive comparison
    console.log('Generating Desktop layout diff visualization...');
    const desktopViewport = { name: 'Desktop', width: 1280, height: 720 };
    
    try {
      const userOutputFrame2 = document.getElementById('user-output-2');
      const expectedOutputFrame2 = document.getElementById('expected-output-2');
      
      if (userOutputFrame2 && expectedOutputFrame2) {
        const userLayoutCanvas = await captureScreenshotAtViewport(userOutputFrame2, desktopViewport);
        const expectedLayoutCanvas = await captureScreenshotAtViewport(expectedOutputFrame2, desktopViewport);
        
        // Generate layout diff visualization
        const layoutDiffCanvas = document.getElementById('layout-diff-canvas');
        if (layoutDiffCanvas && userLayoutCanvas && expectedLayoutCanvas) {
          // Set canvas size to match Desktop viewport - THIS HAPPENS LAST
          layoutDiffCanvas.width = desktopViewport.width;
          layoutDiffCanvas.height = desktopViewport.height + 100; // Extra space for header and legend
          
          const ctx = layoutDiffCanvas.getContext('2d');
          
          // Clear canvas with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, layoutDiffCanvas.width, layoutDiffCanvas.height);
          
          // Draw header
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Layout Difference (Desktop 1280×720)', layoutDiffCanvas.width / 2, 25);
          
          // Draw legend
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#888';
          ctx.fillText('■ Matching content', 20, 50);
          ctx.fillStyle = '#e74c3c';
          ctx.fillText('■ Your layout only', 180, 50);
          ctx.fillStyle = '#3498db';
          ctx.fillText('■ Expected layout only', 320, 50);
          ctx.fillStyle = '#9b59b6';
          ctx.fillText('■ Different content', 480, 50);
          
          // Draw faded original image
          ctx.globalAlpha = 0.3;
          ctx.drawImage(expectedLayoutCanvas, 0, 100, desktopViewport.width, desktopViewport.height);
          ctx.globalAlpha = 1.0;
          
          // Create and draw layout diff using the layout-specific comparison
          const diffImageData = ctx.createImageData(desktopViewport.width, desktopViewport.height);
          const userImageData = userLayoutCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
          const expectedImageData = expectedLayoutCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
          
          // Generate layout-specific diff with custom color coding
          for (let i = 0; i < userImageData.data.length; i += 4) {
            const userR = userImageData.data[i];
            const userG = userImageData.data[i + 1];
            const userB = userImageData.data[i + 2];
            const expectedR = expectedImageData.data[i];
            const expectedG = expectedImageData.data[i + 1];
            const expectedB = expectedImageData.data[i + 2];
            
            // Check if pixels are white (background)
            const userIsWhite = userR > 250 && userG > 250 && userB > 250;
            const expectedIsWhite = expectedR > 250 && expectedG > 250 && expectedB > 250;
            
            if (userIsWhite && expectedIsWhite) {
              // Both white - transparent
              diffImageData.data[i] = 0;
              diffImageData.data[i + 1] = 0;
              diffImageData.data[i + 2] = 0;
              diffImageData.data[i + 3] = 0;
            } else if (userIsWhite && !expectedIsWhite) {
              // User has white, expected has content - blue
              diffImageData.data[i] = 52;     // #3498db
              diffImageData.data[i + 1] = 152;
              diffImageData.data[i + 2] = 219;
              diffImageData.data[i + 3] = 200;
            } else if (!userIsWhite && expectedIsWhite) {
              // User has content, expected has white - red
              diffImageData.data[i] = 231;    // #e74c3c
              diffImageData.data[i + 1] = 76;
              diffImageData.data[i + 2] = 60;
              diffImageData.data[i + 3] = 200;
            } else {
              // Both have content - check if similar
              const diff = Math.abs(userR - expectedR) + Math.abs(userG - expectedG) + Math.abs(userB - expectedB);
              if (diff < 30) {
                // Similar content - grey
                diffImageData.data[i] = 136;    // #888
                diffImageData.data[i + 1] = 136;
                diffImageData.data[i + 2] = 136;
                diffImageData.data[i + 3] = 150;
              } else {
                // Different content - purple
                diffImageData.data[i] = 155;    // #9b59b6
                diffImageData.data[i + 1] = 89;
                diffImageData.data[i + 2] = 182;
                diffImageData.data[i + 3] = 200;
              }
            }
          }
          
          // Draw diff overlay
          ctx.putImageData(diffImageData, 0, 100);
          
          console.log('Desktop layout diff visualization generated successfully');
        }
      }
    } catch (diffError) {
      console.error('Error generating layout diff visualization:', diffError);
    }

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Error in layout comparison test:', error);
    showToast('Error running layout comparison: ' + error.message, 'error');
    
    // Update layout score display with error
    if (layoutScoreElement) {
      layoutScoreElement.textContent = 'Error';
      layoutScoreElement.style.color = '#e74c3c';
    }
  } finally {
    // Remove loading state regardless of outcome
    const runLayoutButton = document.getElementById('run-layout-test');
    if (runLayoutButton) {
      runLayoutButton.disabled = false;
      runLayoutButton.textContent = 'Run Layout Test';
    }
  }
}

// Run responsive visual comparison across all viewport sizes
async function runResponsiveVisualComparison() {
  console.log('Starting responsive visual comparison...');
  
  try {
    const responsiveResults = await captureResponsiveScreenshots();
    const viewportScores = [];
    let validComparisons = 0;

    for (const result of responsiveResults) {
      if (result.error || !result.userCanvas || !result.expectedCanvas) {
        console.warn(`Skipping ${result.viewport.name} due to error: ${result.error || 'Missing canvas'}`);
        continue;
      }

      try {
        // Run PixelMatch comparison for this viewport
        const pixelMatchScore = compareWithPixelMatch(result.userCanvas, result.expectedCanvas);
        
        // Run ResembleJS comparison for this viewport (stored separately for resemblance score)
        const resembleScore = await compareWithResembleJS(result.userCanvas, result.expectedCanvas);
        
        // Visual test score uses ONLY PixelMatch (no averaging with ResembleJS)
        const viewportScore = pixelMatchScore;
        
        viewportScores.push({
          viewport: result.viewport.name,
          pixelMatchScore: pixelMatchScore,
          resembleScore: resembleScore,
          averageScore: viewportScore // This is now just the PixelMatch score
        });
        
        validComparisons++;
        console.log(`${result.viewport.name} visual scores - PixelMatch: ${pixelMatchScore}% (Visual Test), ResembleJS: ${resembleScore}% (Resemblance)`);
        
      } catch (error) {
        console.error(`Error comparing ${result.viewport.name}:`, error);
      }
    }

    if (validComparisons === 0) {
      throw new Error('No valid viewport comparisons could be completed');
    }

    // Calculate overall average score across all viewports (PixelMatch only)
    const totalScore = viewportScores.reduce((sum, score) => sum + score.averageScore, 0);
    const overallAverageScore = Math.round(totalScore / viewportScores.length);

    console.log('Responsive visual comparison results:', viewportScores);
    console.log(`Overall average visual test score (PixelMatch only): ${overallAverageScore}%`);

    return {
      overallScore: overallAverageScore,
      viewportScores: viewportScores,
      validComparisons: validComparisons
    };

  } catch (error) {
    console.error('Error in responsive visual comparison:', error);
    throw error;
  }
}

// Run responsive layout comparison across all viewport sizes
async function runResponsiveLayoutComparison() {
  console.log('Starting responsive layout comparison...');
  
  try {
    const responsiveResults = await captureResponsiveLayoutScreenshots();
    const viewportScores = [];
    let validComparisons = 0;

    for (const result of responsiveResults) {
      if (result.error || !result.userCanvas || !result.expectedCanvas) {
        console.warn(`Skipping ${result.viewport.name} layout due to error: ${result.error || 'Missing canvas'}`);
        continue;
      }

      try {
        // Run PixelMatch comparison for this viewport (layout-specific)
        const pixelMatchScore = compareLayoutWithPixelMatch(result.userCanvas, result.expectedCanvas);
        
        // Run ResembleJS comparison for this viewport (stored separately, not used in layout score)
        const resembleScore = await compareLayoutWithResembleJS(result.userCanvas, result.expectedCanvas);
        
        // Layout test score uses ONLY PixelMatch (no averaging with ResembleJS)
        const viewportScore = pixelMatchScore;
        
        viewportScores.push({
          viewport: result.viewport.name,
          pixelMatchScore: pixelMatchScore,
          resembleScore: resembleScore,
          averageScore: viewportScore // This is now just the PixelMatch score
        });
        
        validComparisons++;
        console.log(`${result.viewport.name} layout scores - PixelMatch: ${pixelMatchScore}% (Layout Test), ResembleJS: ${resembleScore}% (Not used in layout score)`);
        
      } catch (error) {
        console.error(`Error comparing ${result.viewport.name} layout:`, error);
      }
    }

    if (validComparisons === 0) {
      throw new Error('No valid layout viewport comparisons could be completed');
    }

    // Calculate overall average score across all viewports (PixelMatch only)
    const totalScore = viewportScores.reduce((sum, score) => sum + score.averageScore, 0);
    const overallAverageScore = Math.round(totalScore / viewportScores.length);

    console.log('Responsive layout comparison results:', viewportScores);
    console.log(`Overall average layout test score (PixelMatch only): ${overallAverageScore}%`);

    return {
      overallScore: overallAverageScore,
      viewportScores: viewportScores,
      validComparisons: validComparisons
    };

  } catch (error) {
    console.error('Error in responsive layout comparison:', error);
    throw error;
  }
}

// Capture screenshot at specific viewport size
async function captureScreenshotAtViewport(iframe, viewport) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Capturing screenshot at ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      if (!iframe || !iframe.contentDocument) {
        reject(new Error(`Iframe not ready for ${viewport.name} capture`));
        return;
      }

      // Store original iframe dimensions
      const originalWidth = iframe.style.width;
      const originalHeight = iframe.style.height;

      // Set iframe to viewport dimensions
      iframe.style.width = viewport.width + 'px';
      iframe.style.height = viewport.height + 'px';

      // Wait a moment for the iframe to resize and content to adjust
      setTimeout(() => {
        try {
          // Use html2canvas to capture the iframe content at the new size
          html2canvas(iframe.contentDocument.body, {
            width: viewport.width,
            height: viewport.height,
            useCORS: true,
            allowTaint: true,
            scale: 1
          }).then(canvas => {
            // Restore original iframe dimensions
            iframe.style.width = originalWidth;
            iframe.style.height = originalHeight;
            
            console.log(`Successfully captured ${viewport.name} screenshot`);
            resolve(canvas);
          }).catch(error => {
            // Restore original iframe dimensions
            iframe.style.width = originalWidth;
            iframe.style.height = originalHeight;
            reject(new Error(`Failed to capture ${viewport.name} with html2canvas: ${error.message}`));
          });

        } catch (error) {
          // Restore original iframe dimensions
          iframe.style.width = originalWidth;
          iframe.style.height = originalHeight;
          reject(new Error(`Error capturing ${viewport.name} screenshot: ${error.message}`));
        }
      }, 1000); // Wait for iframe resize and content adjustment

    } catch (error) {
      reject(new Error(`Error setting up ${viewport.name} capture: ${error.message}`));
    }
  });
}

// Capture responsive screenshots across all viewport sizes
async function captureResponsiveScreenshots() {
  console.log('Starting responsive screenshot capture...');
  
  const userOutputFrame = document.getElementById('user-output');
  const expectedOutputFrame = document.getElementById('expected-output');

  if (!userOutputFrame || !expectedOutputFrame) {
    throw new Error('Output frames not found');
  }

  const responsiveResults = [];

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    try {
      console.log(`Capturing screenshots for ${viewport.name}...`);
      
      const userCanvas = await captureScreenshotAtViewport(userOutputFrame, viewport);
      const expectedCanvas = await captureScreenshotAtViewport(expectedOutputFrame, viewport);
      
      responsiveResults.push({
        viewport: viewport,
        userCanvas: userCanvas,
        expectedCanvas: expectedCanvas
      });
      
      console.log(`Successfully captured ${viewport.name} screenshots`);
    } catch (error) {
      console.error(`Failed to capture ${viewport.name} screenshots:`, error);
      // Continue with other viewports even if one fails
      responsiveResults.push({
        viewport: viewport,
        userCanvas: null,
        expectedCanvas: null,
        error: error.message
      });
    }
  }

  console.log('Responsive screenshot capture completed');
  return responsiveResults;
}

// Capture responsive layout screenshots across all viewport sizes
async function captureResponsiveLayoutScreenshots() {
  console.log('Starting responsive layout screenshot capture...');
  
  const userOutputFrame2 = document.getElementById('user-output-2');
  const expectedOutputFrame2 = document.getElementById('expected-output-2');

  if (!userOutputFrame2 || !expectedOutputFrame2) {
    throw new Error('Layout output frames not found');
  }

  const responsiveResults = [];

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    try {
      console.log(`Capturing layout screenshots for ${viewport.name}...`);
      
      const userCanvas = await captureScreenshotAtViewport(userOutputFrame2, viewport);
      const expectedCanvas = await captureScreenshotAtViewport(expectedOutputFrame2, viewport);
      
      responsiveResults.push({
        viewport: viewport,
        userCanvas: userCanvas,
        expectedCanvas: expectedCanvas
      });
      
      console.log(`Successfully captured ${viewport.name} layout screenshots`);
    } catch (error) {
      console.error(`Failed to capture ${viewport.name} layout screenshots:`, error);
      // Continue with other viewports even if one fails
      responsiveResults.push({
        viewport: viewport,
        userCanvas: null,
        expectedCanvas: null,
        error: error.message
      });
    }
  }

  console.log('Responsive layout screenshot capture completed');
  return responsiveResults;
}

// Compare layout screenshots using PixelMatch with layout-specific diff canvas
function compareLayoutWithPixelMatch(userCanvas, expectedCanvas, preserveCanvasDimensions = false) {
  try {
    console.log("Starting layout comparison...");

    // Determine the target dimensions for comparison
    const targetWidth = Math.min(userCanvas.width, expectedCanvas.width);
    const targetHeight = Math.min(userCanvas.height, expectedCanvas.height);

    console.log(`Layout canvas dimensions for comparison: ${targetWidth}x${targetHeight}`);

    // Get or create layout diff canvas
    let diffContext;
    if (layoutDiffCanvas) {
      // Only resize canvas if not preserving dimensions (for responsive mode)
      if (!preserveCanvasDimensions) {
        layoutDiffCanvas.width = targetWidth;
        layoutDiffCanvas.height = targetHeight + 80; // Add space for header and legend
      }
      diffContext = layoutDiffCanvas.getContext('2d');
      console.log("Using layout diff canvas");
    } else {
      console.warn("Layout diff canvas not found in DOM, creating temporary canvas");
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight + 80;
      diffContext = tempCanvas.getContext('2d');
    }

    // For preserved dimensions, use the actual canvas dimensions for drawing
    const drawWidth = preserveCanvasDimensions ? layoutDiffCanvas.width : targetWidth;
    const drawHeight = preserveCanvasDimensions ? (layoutDiffCanvas.height - 80) : targetHeight;

    // Clear the canvas with background color
    if (!preserveCanvasDimensions) {
      diffContext.fillStyle = "#ffffff";
      diffContext.fillRect(0, 0, targetWidth, targetHeight + 80);

      // Add header text
      diffContext.font = "bold 14px Arial";
      diffContext.fillStyle = "#333";
      diffContext.textAlign = "left";
      diffContext.fillText("Layout Differences (Black Pixels Only)", 10, 30);

      // Add color legend
      diffContext.font = "11px Arial";
      diffContext.fillStyle = "#666";
      diffContext.fillText("Grey: Matching • Red: User only • Blue: Expected only • Purple: Different", 10, 50);
    }

    // Create image data from both canvases
    const userImageData = userCanvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    const expectedImageData = expectedCanvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    const diffImageData = diffContext.createImageData(targetWidth, targetHeight);

    // Custom pixel comparison that only considers black pixels
    console.log("Running layout black-pixel-only comparison...");
    let mismatchedPixels = 0;
    let blackPixels = 0;

    const userData = userImageData.data;
    const expectedData = expectedImageData.data;
    const diffData = diffImageData.data;

    for (let i = 0; i < userData.length; i += 4) {
      const userR = userData[i];
      const userG = userData[i + 1];
      const userB = userData[i + 2];
      const userA = userData[i + 3];

      const expectedR = expectedData[i];
      const expectedG = expectedData[i + 1];
      const expectedB = expectedData[i + 2];
      const expectedA = expectedData[i + 3];

      // Check if either pixel is black (or very close to black)
      const blackThreshold = 50; // RGB values below this are considered black
      const userIsBlack = (userR < blackThreshold && userG < blackThreshold && userB < blackThreshold && userA > 128);
      const expectedIsBlack = (expectedR < blackThreshold && expectedG < blackThreshold && expectedB < blackThreshold && expectedA > 128);

      // If either pixel is black, we need to compare it
      if (userIsBlack || expectedIsBlack) {
        blackPixels++;

        // Check if the black pixel states are different
        const threshold = 15;
        const rDiff = Math.abs(userR - expectedR);
        const gDiff = Math.abs(userG - expectedG);
        const bDiff = Math.abs(userB - expectedB);
        const aDiff = Math.abs(userA - expectedA);

        const isDifferent = rDiff > threshold || gDiff > threshold || bDiff > threshold || aDiff > threshold;

        if (isDifferent) {
          mismatchedPixels++;
          
          if (userIsBlack && !expectedIsBlack) {
            // User has black pixel where expected doesn't - red
            diffData[i] = 231;     // Red
            diffData[i + 1] = 76;  // Green
            diffData[i + 2] = 60;  // Blue
            diffData[i + 3] = 200; // Alpha
          } else if (!userIsBlack && expectedIsBlack) {
            // Expected has black pixel where user doesn't - blue
            diffData[i] = 52;      // Red
            diffData[i + 1] = 152; // Green
            diffData[i + 2] = 219; // Blue
            diffData[i + 3] = 200; // Alpha
          } else {
            // Both have black pixels but different intensities - purple
            diffData[i] = 155;     // Red
            diffData[i + 1] = 89;  // Green
            diffData[i + 2] = 182; // Blue
            diffData[i + 3] = 200; // Alpha
          }
        } else {
          // Black pixels match - show grey
          diffData[i] = 128;     // Grey
          diffData[i + 1] = 128; // Grey
          diffData[i + 2] = 128; // Grey
          diffData[i + 3] = 150; // Semi-transparent
        }
      } else {
        // Neither pixel is black, make transparent in diff (ignored)
        diffData[i] = 0;
        diffData[i + 1] = 0;
        diffData[i + 2] = 0;
        diffData[i + 3] = 0;
      }
    }

    console.log(`Layout comparison complete. Found ${mismatchedPixels} mismatched black pixels out of ${blackPixels} total black pixels.`);

    // First draw a very faded version of the original for context
    diffContext.globalAlpha = 0.2;
    diffContext.drawImage(userCanvas, 0, 0, targetWidth, targetHeight, 0, 80, targetWidth, targetHeight);
    diffContext.globalAlpha = 1.0;

    // Draw the diff data
    console.log("Drawing layout diff visualization...");
    diffContext.putImageData(diffImageData, 0, 80);

    // Calculate match percentage based only on content pixels
    let matchPercentage = 100;
    let percentageMismatch = 0;

    if (blackPixels > 0) {
      matchPercentage = 100 - (mismatchedPixels / blackPixels * 100);
      percentageMismatch = (mismatchedPixels / blackPixels * 100).toFixed(2);
    } else {
      console.log("No black pixels found for layout comparison");
    }

    // Add info about detected differences
    diffContext.font = "12px Arial";
    diffContext.fillStyle = "#666";
    diffContext.textAlign = "right";
    diffContext.fillText(`Layout differences: ${mismatchedPixels}/${blackPixels} pixels (${percentageMismatch}%)`, targetWidth - 10, 30);

    console.log("Layout black-pixel-only visual comparison completed successfully");
    return Math.round(matchPercentage);
  } catch (error) {
    console.error("ERROR IN LAYOUT VISUAL COMPARISON:", error);

    // Create a simple error display
    if (layoutDiffCanvas) {
      const ctx = layoutDiffCanvas.getContext('2d');
      layoutDiffCanvas.width = 500;
      layoutDiffCanvas.height = 200;

      ctx.fillStyle = "#fff0f0";
      ctx.fillRect(0, 0, 500, 200);

      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#e74c3c";
      ctx.textAlign = "center";
      ctx.fillText("Error in Layout Comparison", 250, 50);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.fillText(error.message, 250, 80);
      ctx.fillText("Check browser console for details", 250, 110);
    }

    return 0;
  }
}

// Compare layout using ResembleJS with layout-specific settings
async function compareLayoutWithResembleJS(userCanvas, expectedCanvas) {
  return new Promise((resolve) => {
    try {
      console.log("Starting ResembleJS layout comparison...");

      // Convert canvases to data URLs
      const userDataURL = userCanvas.toDataURL();
      const expectedDataURL = expectedCanvas.toDataURL();

      // Configure ResembleJS for layout comparison
      ResembleJS.compare(userDataURL, expectedDataURL, {
        ignore: 'colors',
        includeAA: false,
        threshold: 0.1
      }, (err, data) => {
        if (err) {
          console.error("ResembleJS layout comparison error:", err);
          resolve(0);
          return;
        }

        const similarity = 100 - parseFloat(data.misMatchPercentage);
        const score = Math.max(0, Math.round(similarity));
        
        console.log(`ResembleJS layout comparison completed. Score: ${score}%`);
        resolve(score);
      });

    } catch (error) {
      console.error("ERROR IN RESEMBLEJS LAYOUT COMPARISON:", error);
      resolve(0);
    }
  });
}

// Run all tests (Functional, Visual, Layout) with responsive testing
async function runAllTests() {
  try {
    console.log('Starting comprehensive test suite...');
    showToast('Running comprehensive test suite...', 'success');

    // Add loading state to the button
    if (runAllButton) {
      runAllButton.classList.add('loading');
      runAllButton.disabled = true;
    }

    // Clear previous scores
    if (functionalScoreElement) functionalScoreElement.textContent = '-';
    if (visualScoreElement) visualScoreElement.textContent = '-';
    if (layoutScoreElement) layoutScoreElement.textContent = '-';
    if (totalScoreElement) totalScoreElement.textContent = '-';

    // Step 1: Run Functional Tests
    console.log('Step 1: Running functional tests...');
    showToast('Running functional tests...', 'success');
    
    const functionalScore = await testE2EFunctionality();
    
    console.log('Functional test completed with score:', functionalScore + '%');
    functionalScoreElement.textContent = functionalScore + '%';
    applyScoreColor(functionalScoreElement, functionalScore);

    // Step 2: Run Responsive Visual Tests
    console.log('Step 2: Running responsive visual tests...');
    showToast('Running responsive visual tests...', 'success');
    
    const visualResults = await runResponsiveVisualComparison();
    const visualScore = visualResults.overallScore;
    
    console.log('Responsive visual test completed with score:', visualScore + '%');
    visualScoreElement.textContent = visualScore + '%';
    applyScoreColor(visualScoreElement, visualScore);
    
    // Store results for detailed breakdown
    window.lastVisualResults = visualResults;

    // Step 3: Run Responsive Layout Tests
    console.log('Step 3: Running responsive layout tests...');
    showToast('Running responsive layout tests...', 'success');
    
    const layoutResults = await runResponsiveLayoutComparison();
    const layoutScore = layoutResults.overallScore;
    
    console.log('Responsive layout test completed with score:', layoutScore + '%');
    layoutScoreElement.textContent = layoutScore + '%';
    applyScoreColor(layoutScoreElement, layoutScore);
    
    // Store results for detailed breakdown
    window.lastLayoutResults = layoutResults;

    // Generate Desktop-only diff visualizations for comprehensive testing
    console.log('Generating Desktop diff visualizations for comprehensive results...');
    const desktopViewport = { name: 'Desktop', width: 1280, height: 720 };
    
    try {
      // Generate visual diff
      const userOutputFrame = document.getElementById('user-output');
      const expectedOutputFrame = document.getElementById('expected-output');
      
      if (userOutputFrame && expectedOutputFrame) {
        const userCanvas = await captureScreenshotAtViewport(userOutputFrame, desktopViewport);
        const expectedCanvas = await captureScreenshotAtViewport(expectedOutputFrame, desktopViewport);
        
        const diffCanvas = document.getElementById('diff-canvas');
        if (diffCanvas && userCanvas && expectedCanvas) {
          diffCanvas.width = desktopViewport.width;
          diffCanvas.height = desktopViewport.height + 80;
          
          const ctx = diffCanvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, diffCanvas.width, diffCanvas.height);
          
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Visual Difference (Desktop 1280×720)', diffCanvas.width / 2, 25);
          
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#e74c3c';
          ctx.fillText('■ Different pixels', 20, 50);
          ctx.fillStyle = '#3498db';
          ctx.fillText('■ Missing elements', 150, 50);
          ctx.fillStyle = '#2c3e50';
          ctx.fillText('■ Matching areas', 280, 50);
          
          ctx.globalAlpha = 0.3;
          ctx.drawImage(expectedCanvas, 0, 80, desktopViewport.width, desktopViewport.height);
          ctx.globalAlpha = 1.0;
          
          const diffImageData = ctx.createImageData(desktopViewport.width, desktopViewport.height);
          const userImageData = userCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
          const expectedImageData = expectedCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
          
          const pixelmatch = (await import('pixelmatch')).default;
          pixelmatch(
            userImageData.data,
            expectedImageData.data,
            diffImageData.data,
            desktopViewport.width,
            desktopViewport.height,
            { threshold: 0.1, alpha: 0.8 }
          );
          
          ctx.putImageData(diffImageData, 0, 80);
        }
      }
      
      // Generate layout diff
      const userOutputFrame2 = document.getElementById('user-output-2');
      const expectedOutputFrame2 = document.getElementById('expected-output-2');
      
      if (userOutputFrame2 && expectedOutputFrame2) {
        const userLayoutCanvas = await captureScreenshotAtViewport(userOutputFrame2, desktopViewport);
        const expectedLayoutCanvas = await captureScreenshotAtViewport(expectedOutputFrame2, desktopViewport);
        
        const layoutDiffCanvas = document.getElementById('layout-diff-canvas');
        if (layoutDiffCanvas && userLayoutCanvas && expectedLayoutCanvas) {
          layoutDiffCanvas.width = desktopViewport.width;
          layoutDiffCanvas.height = desktopViewport.height + 100;
          
          const ctx = layoutDiffCanvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, layoutDiffCanvas.width, layoutDiffCanvas.height);
          
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Layout Difference (Desktop 1280×720)', layoutDiffCanvas.width / 2, 25);
          
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#888';
          ctx.fillText('■ Matching content', 20, 50);
          ctx.fillStyle = '#e74c3c';
          ctx.fillText('■ Your layout only', 180, 50);
          ctx.fillStyle = '#3498db';
          ctx.fillText('■ Expected layout only', 320, 50);
          ctx.fillStyle = '#9b59b6';
          ctx.fillText('■ Different content', 480, 50);
          
          ctx.globalAlpha = 0.3;
          ctx.drawImage(expectedLayoutCanvas, 0, 100, desktopViewport.width, desktopViewport.height);
          ctx.globalAlpha = 1.0;
          
          const diffImageData = ctx.createImageData(desktopViewport.width, desktopViewport.height);
          const userImageData = userLayoutCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
          const expectedImageData = expectedLayoutCanvas.getContext('2d').getImageData(0, 0, desktopViewport.width, desktopViewport.height);
          
          for (let i = 0; i < userImageData.data.length; i += 4) {
            const userR = userImageData.data[i];
            const userG = userImageData.data[i + 1];
            const userB = userImageData.data[i + 2];
            const expectedR = expectedImageData.data[i];
            const expectedG = expectedImageData.data[i + 1];
            const expectedB = expectedImageData.data[i + 2];
            
            const userIsWhite = userR > 250 && userG > 250 && userB > 250;
            const expectedIsWhite = expectedR > 250 && expectedG > 250 && expectedB > 250;
            
            if (userIsWhite && expectedIsWhite) {
              diffImageData.data[i] = 0;
              diffImageData.data[i + 1] = 0;
              diffImageData.data[i + 2] = 0;
              diffImageData.data[i + 3] = 0;
            } else if (userIsWhite && !expectedIsWhite) {
              diffImageData.data[i] = 52;
              diffImageData.data[i + 1] = 152;
              diffImageData.data[i + 2] = 219;
              diffImageData.data[i + 3] = 200;
            } else if (!userIsWhite && expectedIsWhite) {
              diffImageData.data[i] = 231;
              diffImageData.data[i + 1] = 76;
              diffImageData.data[i + 2] = 60;
              diffImageData.data[i + 3] = 200;
            } else {
              const diff = Math.abs(userR - expectedR) + Math.abs(userG - expectedG) + Math.abs(userB - expectedB);
              if (diff < 30) {
                diffImageData.data[i] = 136;
                diffImageData.data[i + 1] = 136;
                diffImageData.data[i + 2] = 136;
                diffImageData.data[i + 3] = 150;
              } else {
                diffImageData.data[i] = 155;
                diffImageData.data[i + 1] = 89;
                diffImageData.data[i + 2] = 182;
                diffImageData.data[i + 3] = 200;
              }
            }
          }
          
          ctx.putImageData(diffImageData, 0, 100);
        }
      }
      
      console.log('Desktop diff visualizations generated for comprehensive testing');
    } catch (diffError) {
      console.error('Error generating comprehensive diff visualizations:', diffError);
    }

    // Calculate final score using the new specified formula
    // Extract individual scores for the new formula
    let pixelMatchVisualScore = 0;
    let resemblanceScore = 0;
    let pixelMatchLayoutScore = 0;
    let resemblanceLayoutScore = 0;
    
    // Extract PixelMatch visual score (excluding ResembleJS)
    if (window.lastVisualResults && window.lastVisualResults.viewportScores) {
      const pixelMatchScores = window.lastVisualResults.viewportScores.map(score => score.pixelMatchScore);
      pixelMatchVisualScore = Math.round(pixelMatchScores.reduce((sum, score) => sum + score, 0) / pixelMatchScores.length);
    }
    
    // Extract ResembleJS score separately
    if (window.lastVisualResults && window.lastVisualResults.viewportScores) {
      const resembleScores = window.lastVisualResults.viewportScores.map(score => score.resembleScore);
      resemblanceScore = Math.round(resembleScores.reduce((sum, score) => sum + score, 0) / resembleScores.length);
    }
    
    // New formula: Functional (40%) + Visual Test Score (25%) + Resemblance Score (25%) + Layout (10%)
    const finalScore = Math.round(
      (functionalScore * 0.4) + 
      (pixelMatchVisualScore * 0.25) + 
      (resemblanceScore * 0.25) + 
      (layoutScore * 0.1)
    );

    console.log(`Final score calculated with new formula:`);
    console.log(`  Functional: ${functionalScore}% × 0.4 = ${(functionalScore * 0.4).toFixed(1)}`);
    console.log(`  Visual Test (PixelMatch): ${pixelMatchVisualScore}% × 0.25 = ${(pixelMatchVisualScore * 0.25).toFixed(1)}`);
    console.log(`  Resemblance: ${resemblanceScore}% × 0.25 = ${(resemblanceScore * 0.25).toFixed(1)}`);
    console.log(`  Layout: ${layoutScore}% × 0.1 = ${(layoutScore * 0.1).toFixed(1)}`);
    console.log(`  Final Score: ${finalScore}%`);
    
    totalScoreElement.textContent = finalScore + '%';
    applyScoreColor(totalScoreElement, finalScore);

    // Create comprehensive results summary
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
      // Remove any existing comprehensive summary
      const existingSummary = document.getElementById('comprehensive-results-summary');
      if (existingSummary) {
        existingSummary.remove();
      }

      // Create new comprehensive summary
      let summarySection = document.createElement('div');
      summarySection.id = 'comprehensive-results-summary';
      summarySection.className = 'test-results-container';
      summarySection.style.marginTop = '20px';
      summarySection.style.marginBottom = '20px';
      summarySection.style.border = '2px solid #3498db';
      summarySection.style.borderRadius = '8px';
      summarySection.style.padding = '15px';
      summarySection.style.backgroundColor = '#f8f9fa';

      // Insert at the beginning of results container, after the h2
      const resultsHeader = resultsContainer.querySelector('h2');
      if (resultsHeader) {
        resultsHeader.insertAdjacentElement('afterend', summarySection);
      } else {
        resultsContainer.insertBefore(summarySection, resultsContainer.firstChild);
      }

      // Header
      const header = document.createElement('div');
      header.className = 'test-results-header';
      header.innerHTML = '<span>🎯 Comprehensive Test Results Summary</span>';
      header.style.fontSize = '18px';
      header.style.fontWeight = 'bold';
      header.style.color = '#2c3e50';
      summarySection.appendChild(header);

      // Individual scores breakdown
      const breakdown = document.createElement('div');
      breakdown.style.display = 'grid';
      breakdown.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
      breakdown.style.gap = '10px';
      breakdown.style.marginTop = '15px';

      const createScoreItem = (label, score, weight) => {
        const item = document.createElement('div');
        item.className = 'test-result-item';
        item.style.padding = '10px';
        item.style.backgroundColor = 'white';
        item.style.borderRadius = '6px';
        item.style.border = '1px solid #ddd';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${label} (${weight}%)`;
        nameSpan.style.fontWeight = 'bold';

        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = `${score}%`;
        scoreSpan.style.fontWeight = 'bold';
        applyScoreColor(scoreSpan, score);

        item.appendChild(nameSpan);
        item.appendChild(document.createElement('br'));
        item.appendChild(scoreSpan);
        return item;
      };

      breakdown.appendChild(createScoreItem('Functional', functionalScore, 40));
      breakdown.appendChild(createScoreItem('Visual Test', pixelMatchVisualScore, 25));
      breakdown.appendChild(createScoreItem('Resemblance', resemblanceScore, 25));
      breakdown.appendChild(createScoreItem('Layout', layoutScore, 10));

      summarySection.appendChild(breakdown);

      // Responsive breakdown section
      if (window.lastVisualResults || window.lastLayoutResults) {
        const responsiveBreakdown = document.createElement('div');
        responsiveBreakdown.style.marginTop = '20px';
        responsiveBreakdown.style.padding = '15px';
        responsiveBreakdown.style.backgroundColor = '#f8f9fa';
        responsiveBreakdown.style.borderRadius = '6px';
        responsiveBreakdown.style.border = '1px solid #dee2e6';

        const responsiveHeader = document.createElement('h4');
        responsiveHeader.textContent = '📱 Responsive Testing Breakdown';
        responsiveHeader.style.margin = '0 0 15px 0';
        responsiveHeader.style.color = '#2c3e50';
        responsiveBreakdown.appendChild(responsiveHeader);

        // Visual scores by viewport
        if (window.lastVisualResults && window.lastVisualResults.viewportScores) {
          const visualSection = document.createElement('div');
          visualSection.style.marginBottom = '15px';

          const visualTitle = document.createElement('h5');
          visualTitle.textContent = '👁️ Visual Scores by Viewport';
          visualTitle.style.margin = '0 0 10px 0';
          visualTitle.style.color = '#34495e';
          visualSection.appendChild(visualTitle);

          const visualGrid = document.createElement('div');
          visualGrid.style.display = 'grid';
          visualGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
          visualGrid.style.gap = '8px';

          window.lastVisualResults.viewportScores.forEach(score => {
            const viewportItem = document.createElement('div');
            viewportItem.style.padding = '8px';
            viewportItem.style.backgroundColor = 'white';
            viewportItem.style.borderRadius = '4px';
            viewportItem.style.border = '1px solid #ddd';
            viewportItem.style.textAlign = 'center';

            const viewportName = document.createElement('div');
            viewportName.textContent = score.viewport;
            viewportName.style.fontWeight = 'bold';
            viewportName.style.fontSize = '12px';
            viewportName.style.marginBottom = '4px';

            const viewportScore = document.createElement('div');
            viewportScore.textContent = `${score.averageScore}%`;
            viewportScore.style.fontSize = '14px';
            viewportScore.style.fontWeight = 'bold';
            applyScoreColor(viewportScore, score.averageScore);

            viewportItem.appendChild(viewportName);
            viewportItem.appendChild(viewportScore);
            visualGrid.appendChild(viewportItem);
          });

          visualSection.appendChild(visualGrid);
          responsiveBreakdown.appendChild(visualSection);
        }

        // Layout scores by viewport
        if (window.lastLayoutResults && window.lastLayoutResults.viewportScores) {
          const layoutSection = document.createElement('div');

          const layoutTitle = document.createElement('h5');
          layoutTitle.textContent = '📐 Layout Scores by Viewport';
          layoutTitle.style.margin = '0 0 10px 0';
          layoutTitle.style.color = '#34495e';
          layoutSection.appendChild(layoutTitle);

          const layoutGrid = document.createElement('div');
          layoutGrid.style.display = 'grid';
          layoutGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
          layoutGrid.style.gap = '8px';

          window.lastLayoutResults.viewportScores.forEach(score => {
            const viewportItem = document.createElement('div');
            viewportItem.style.padding = '8px';
            viewportItem.style.backgroundColor = 'white';
            viewportItem.style.borderRadius = '4px';
            viewportItem.style.border = '1px solid #ddd';
            viewportItem.style.textAlign = 'center';

            const viewportName = document.createElement('div');
            viewportName.textContent = score.viewport;
            viewportName.style.fontWeight = 'bold';
            viewportName.style.fontSize = '12px';
            viewportName.style.marginBottom = '4px';

            const viewportScore = document.createElement('div');
            viewportScore.textContent = `${score.averageScore}%`;
            viewportScore.style.fontSize = '14px';
            viewportScore.style.fontWeight = 'bold';
            applyScoreColor(viewportScore, score.averageScore);

            viewportItem.appendChild(viewportName);
            viewportItem.appendChild(viewportScore);
            layoutGrid.appendChild(viewportItem);
          });

          layoutSection.appendChild(layoutGrid);
          responsiveBreakdown.appendChild(layoutSection);
        }

        summarySection.appendChild(responsiveBreakdown);
      }

      // Final score
      const finalScoreItem = document.createElement('div');
      finalScoreItem.className = 'test-result-item';
      finalScoreItem.style.marginTop = '15px';
      finalScoreItem.style.padding = '15px';
      finalScoreItem.style.backgroundColor = '#2c3e50';
      finalScoreItem.style.color = 'white';
      finalScoreItem.style.borderRadius = '6px';
      finalScoreItem.style.fontSize = '18px';
      finalScoreItem.style.fontWeight = 'bold';
      finalScoreItem.style.textAlign = 'center';

      finalScoreItem.innerHTML = `
        <span>🏆 Final Score: ${finalScore}%</span>
      `;
      summarySection.appendChild(finalScoreItem);

      // Formula explanation
      const formulaExplanation = document.createElement('div');
      formulaExplanation.style.marginTop = '10px';
      formulaExplanation.style.fontSize = '12px';
      formulaExplanation.style.color = '#666';
      formulaExplanation.style.textAlign = 'center';
      formulaExplanation.style.fontStyle = 'italic';
      formulaExplanation.innerHTML = `
        Formula: (${functionalScore} × 0.4) + (${pixelMatchVisualScore}% × 0.25) + (${resemblanceScore}% × 0.25) + (${layoutScore}% × 0.1) = ${finalScore}%<br>
        <small>Scores averaged across Desktop (1280×720), Tablet (768×1024), and Mobile (360×640) viewports</small>
      `;
      summarySection.appendChild(formulaExplanation);
    }

    console.log('Comprehensive test suite completed successfully');
    showToast(`All tests completed! Final score: ${finalScore}%`, 'success');

    // Step 4: Generate viewport-specific diff visualizations
    console.log('Step 4: Generating viewport-specific diff visualizations...');
    showToast('Generating viewport diffs...', 'success');
    
    try {
      await generateAllViewportDiffs();
      console.log('Viewport diffs generated successfully');
    } catch (error) {
      console.error('Error generating viewport diffs:', error);
      showToast('Note: Could not generate viewport diffs', 'warning');
    }

    // Scroll to results
    if (resultsContainer) {
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

  } catch (error) {
    console.error('Comprehensive testing error:', error);
    showToast('An error occurred during comprehensive testing: ' + error.message, 'error');
  } finally {
    // Hide loading state regardless of success or failure
    if (runAllButton) {
      runAllButton.classList.remove('loading');
      runAllButton.disabled = false;
    }
  }
}

// Function to display captured outputs for all viewport dimensions
async function displayViewportOutputs() {
  try {
    console.log('Capturing and displaying outputs for all viewport dimensions...');
    showToast('Capturing outputs for all viewports...', 'success');

    // Clear any existing viewport outputs display
    const existingDisplay = document.getElementById('viewport-outputs-display');
    if (existingDisplay) {
      existingDisplay.remove();
    }

    // Create main container for viewport outputs
    const resultsContainer = document.getElementById('results');
    const viewportOutputsContainer = document.createElement('div');
    viewportOutputsContainer.id = 'viewport-outputs-display';
    viewportOutputsContainer.style.marginTop = '20px';
    viewportOutputsContainer.style.padding = '20px';
    viewportOutputsContainer.style.backgroundColor = '#f8f9fa';
    viewportOutputsContainer.style.borderRadius = '8px';
    viewportOutputsContainer.style.border = '2px solid #007bff';

    // Header
    const header = document.createElement('h2');
    header.textContent = '📱 Generated Outputs by Viewport Dimension';
    header.style.color = '#2c3e50';
    header.style.marginBottom = '20px';
    header.style.textAlign = 'center';
    viewportOutputsContainer.appendChild(header);

    // Get iframe references
    const userOutputFrame = document.getElementById('user-output');
    const expectedOutputFrame = document.getElementById('expected-output');
    const userOutputFrame2 = document.getElementById('user-output-2');
    const expectedOutputFrame2 = document.getElementById('expected-output-2');

    if (!userOutputFrame || !expectedOutputFrame || !userOutputFrame2 || !expectedOutputFrame2) {
      throw new Error('Output frames not found. Please run your code first.');
    }

    // Capture outputs for each viewport
    for (const viewport of RESPONSIVE_VIEWPORTS) {
      console.log(`Capturing outputs for ${viewport.name}...`);

      // Create viewport section
      const viewportSection = document.createElement('div');
      viewportSection.style.marginBottom = '30px';
      viewportSection.style.padding = '15px';
      viewportSection.style.backgroundColor = 'white';
      viewportSection.style.borderRadius = '6px';
      viewportSection.style.border = '1px solid #dee2e6';

      // Viewport header
      const viewportHeader = document.createElement('h3');
      viewportHeader.textContent = `${viewport.name} (${viewport.width}×${viewport.height})`;
      viewportHeader.style.color = '#495057';
      viewportHeader.style.marginBottom = '15px';
      viewportHeader.style.textAlign = 'center';
      viewportSection.appendChild(viewportHeader);

      // Create grid for outputs
      const outputGrid = document.createElement('div');
      outputGrid.style.display = 'grid';
      outputGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
      outputGrid.style.gap = '15px';

      try {
        // Capture User Output
        const userCanvas = await captureScreenshotAtViewport(userOutputFrame, viewport);
        const userOutputDiv = createOutputDisplay('User Output', userCanvas, viewport);
        outputGrid.appendChild(userOutputDiv);

        // Capture Expected Output
        const expectedCanvas = await captureScreenshotAtViewport(expectedOutputFrame, viewport);
        const expectedOutputDiv = createOutputDisplay('Expected Output', expectedCanvas, viewport);
        outputGrid.appendChild(expectedOutputDiv);

        // Capture User Layout Output
        const userLayoutCanvas = await captureScreenshotAtViewport(userOutputFrame2, viewport);
        const userLayoutDiv = createOutputDisplay('User Layout', userLayoutCanvas, viewport);
        outputGrid.appendChild(userLayoutDiv);

        // Capture Expected Layout Output
        const expectedLayoutCanvas = await captureScreenshotAtViewport(expectedOutputFrame2, viewport);
        const expectedLayoutDiv = createOutputDisplay('Expected Layout', expectedLayoutCanvas, viewport);
        outputGrid.appendChild(expectedLayoutDiv);

      } catch (error) {
        console.error(`Error capturing ${viewport.name} outputs:`, error);
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.color = '#721c24';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = `Error capturing ${viewport.name} outputs: ${error.message}`;
        outputGrid.appendChild(errorDiv);
      }

      viewportSection.appendChild(outputGrid);
      viewportOutputsContainer.appendChild(viewportSection);
    }

    // Add to results container
    resultsContainer.appendChild(viewportOutputsContainer);

    // Scroll to the new display
    viewportOutputsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log('Viewport outputs display completed');
    showToast('Viewport outputs captured and displayed!', 'success');

  } catch (error) {
    console.error('Error displaying viewport outputs:', error);
    showToast('Error displaying viewport outputs: ' + error.message, 'error');
  }
}

// Helper function to create output display for a single canvas
function createOutputDisplay(title, canvas, viewport) {
  const outputDiv = document.createElement('div');
  outputDiv.style.textAlign = 'center';
  outputDiv.style.padding = '10px';
  outputDiv.style.backgroundColor = '#f8f9fa';
  outputDiv.style.borderRadius = '4px';
  outputDiv.style.border = '1px solid #dee2e6';

  // Title
  const titleElement = document.createElement('h4');
  titleElement.textContent = title;
  titleElement.style.margin = '0 0 10px 0';
  titleElement.style.color = '#495057';
  titleElement.style.fontSize = '14px';
  outputDiv.appendChild(titleElement);

  // Canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.style.maxWidth = '100%';
  canvasContainer.style.overflow = 'hidden';
  canvasContainer.style.border = '1px solid #ccc';
  canvasContainer.style.borderRadius = '4px';
  canvasContainer.style.backgroundColor = 'white';

  // Scale canvas to fit container while maintaining aspect ratio
  const displayCanvas = document.createElement('canvas');
  const maxDisplayWidth = 280;
  const scale = Math.min(maxDisplayWidth / canvas.width, 1);
  
  displayCanvas.width = canvas.width * scale;
  displayCanvas.height = canvas.height * scale;
  displayCanvas.style.width = displayCanvas.width + 'px';
  displayCanvas.style.height = displayCanvas.height + 'px';
  displayCanvas.style.display = 'block';
  displayCanvas.style.margin = '0 auto';

  // Draw scaled image
  const ctx = displayCanvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);

  canvasContainer.appendChild(displayCanvas);
  outputDiv.appendChild(canvasContainer);

  // Dimensions info
  const dimensionsInfo = document.createElement('div');
  dimensionsInfo.textContent = `${canvas.width}×${canvas.height}px`;
  dimensionsInfo.style.fontSize = '12px';
  dimensionsInfo.style.color = '#6c757d';
  dimensionsInfo.style.marginTop = '5px';
  outputDiv.appendChild(dimensionsInfo);

  return outputDiv;
}

// Initialize with sample Todo app code
function initializeSampleCode() {
  // User version with visual differences and images
  const userHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
</head>
<body>
  <div class="todo-container">
    <img src="https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" alt="User Logo" class="logo" width="100px" height="100px">
    <h1>My Todo List</h1>
    <div class="input-section">
      <input type="text" id="todo-input" placeholder="Enter a task...">
      <button id="add-button">Add Task</button>
    </div>
    <ul id="todo-list"></ul>
    <div class="footer">
      <img src="https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" alt="Footer Image" class="footer-img" width="100px" height="100px">
      <p>Powered by User Implementation</p>
    </div>
  </div>
</body>
</html>
  `;

  const userCSS = `
body {
  font-family: 'Comic Sans MS', cursive;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  padding: 20px;
  margin: 0;
}

.logo {
  display: block;
  margin: 0 auto 20px auto;
  border-radius: 10px;
}

.todo-container {
  max-width: 500px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border: 3px solid #ff6b6b;
}

h1 {
  text-align: center;
  color: #ff6b6b;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 30px;
}

.input-section {
  display: flex;
  margin-bottom: 25px;
  gap: 10px;
}

#todo-input {
  flex: 1;
  padding: 15px;
  border: 3px solid #4ecdc4;
  border-radius: 25px;
  font-size: 16px;
  background: #f0f8ff;
}

#add-button {
  padding: 15px 25px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  transition: all 0.3s ease;
}

#add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
}

#todo-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.delete-btn {
  padding: 8px 15px;
  background: linear-gradient(45deg, #ff4757, #ff6b7a);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.5);
}

.footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #4ecdc4;
}

.footer-img {
  margin-bottom: 10px;
}

.footer p {
  color: #666;
  font-style: italic;
  margin: 0;
}
  `;

  // Expected version with different styling and images
  const expectedHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
</head>
<body>
  <div class="todo-container">
    <img src="https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" alt="Expected Logo" class="logo" width="100px" height="100px">
    <h1>My Todo List</h1>
    <div class="input-section">
      <input type="text" id="todo-input" placeholder="Enter a task...">
      <button id="add-button">Add Task</button>
    </div>
    <ul id="todo-list"></ul>
    <div class="footer">
      <img src="https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" alt="Footer Image" class="footer-img" width="100px" height="100px">
      <p>Powered by Expected Implementation</p>
    </div>
  </div>
</body>
</html>
  `;

  const expectedCSS = `
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  padding: 20px;
  margin: 0;
}

.logo {
  display: block;
  margin: 0 auto 15px auto;
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
  margin-bottom: 20px;
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

.footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.footer-img {
  margin-bottom: 5px;
}

.footer p {
  color: #666;
  margin: 0;
}
  `;

  const sharedJS = `
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

  // Set user code
  htmlEditor.value = userHTML.trim();
  cssEditor.value = userCSS.trim();
  jsEditor.value = sharedJS.trim();

  // Set expected code
  solutionHtmlEditor.value = expectedHTML.trim();
  solutionCssEditor.value = expectedCSS.trim();
  solutionJsEditor.value = sharedJS.trim();

  console.log('Sample code with images initialized for both user and expected versions');
}

// ... existing code ...

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeSampleCode();
  // ... existing initialization code ...
});

// Generate diff visualizations for all viewport dimensions
async function generateAllViewportDiffs() {
  console.log('Generating diff visualizations for all viewport dimensions...');
  
  try {
    const userOutputFrame = document.getElementById('user-output');
    const expectedOutputFrame = document.getElementById('expected-output');
    const userOutputFrame2 = document.getElementById('user-output-2');
    const expectedOutputFrame2 = document.getElementById('expected-output-2');

    if (!userOutputFrame || !expectedOutputFrame || !userOutputFrame2 || !expectedOutputFrame2) {
      throw new Error('Output frames not found');
    }

    // Create or get the viewport diffs container
    let viewportDiffsContainer = document.getElementById('viewport-diffs-container');
    if (!viewportDiffsContainer) {
      viewportDiffsContainer = document.createElement('div');
      viewportDiffsContainer.id = 'viewport-diffs-container';
      viewportDiffsContainer.style.marginTop = '30px';
      viewportDiffsContainer.style.marginBottom = '20px';
      
      // Insert after the main diff containers
      const resultsContainer = document.getElementById('results');
      if (resultsContainer) {
        const lastDiffContainer = resultsContainer.querySelector('.diff-container:last-child');
        if (lastDiffContainer) {
          lastDiffContainer.insertAdjacentElement('afterend', viewportDiffsContainer);
        } else {
          resultsContainer.appendChild(viewportDiffsContainer);
        }
      }
    } else {
      // Clear existing content
      viewportDiffsContainer.innerHTML = '';
    }

    // Add header
    const header = document.createElement('h2');
    header.textContent = '📱 Viewport-Specific Diff Visualizations';
    header.style.color = '#2c3e50';
    header.style.marginBottom = '20px';
    header.style.textAlign = 'center';
    viewportDiffsContainer.appendChild(header);

    // Generate diffs for each viewport
    for (const viewport of RESPONSIVE_VIEWPORTS) {
      console.log(`Generating diffs for ${viewport.name}...`);
      
      try {
        // Capture screenshots for this viewport
        const userVisualCanvas = await captureScreenshotAtViewport(userOutputFrame, viewport);
        const expectedVisualCanvas = await captureScreenshotAtViewport(expectedOutputFrame, viewport);
        const userLayoutCanvas = await captureScreenshotAtViewport(userOutputFrame2, viewport);
        const expectedLayoutCanvas = await captureScreenshotAtViewport(expectedOutputFrame2, viewport);

        // Create viewport section
        const viewportSection = document.createElement('div');
        viewportSection.className = 'viewport-diff-section';
        viewportSection.style.marginBottom = '40px';
        viewportSection.style.border = '2px solid #34495e';
        viewportSection.style.borderRadius = '10px';
        viewportSection.style.padding = '20px';
        viewportSection.style.backgroundColor = '#f8f9fa';

        // Viewport header
        const viewportHeader = document.createElement('h3');
        viewportHeader.textContent = `${viewport.name} (${viewport.width}×${viewport.height})`;
        viewportHeader.style.color = '#2c3e50';
        viewportHeader.style.marginBottom = '20px';
        viewportHeader.style.textAlign = 'center';
        viewportSection.appendChild(viewportHeader);

        // Create diff container for this viewport
        const diffsContainer = document.createElement('div');
        diffsContainer.style.display = 'grid';
        diffsContainer.style.gridTemplateColumns = '1fr 1fr';
        diffsContainer.style.gap = '20px';
        diffsContainer.style.marginBottom = '20px';

        // Visual Diff
        const visualDiffContainer = document.createElement('div');
        visualDiffContainer.style.textAlign = 'center';
        
        const visualDiffTitle = document.createElement('h4');
        visualDiffTitle.textContent = 'Visual Difference';
        visualDiffTitle.style.color = '#3498db';
        visualDiffTitle.style.marginBottom = '10px';
        visualDiffContainer.appendChild(visualDiffTitle);

        const visualDiffCanvas = document.createElement('canvas');
        visualDiffCanvas.id = `visual-diff-${viewport.name.toLowerCase()}`;
        visualDiffCanvas.style.border = '1px solid #ddd';
        visualDiffCanvas.style.borderRadius = '5px';
        visualDiffCanvas.style.maxWidth = '100%';
        visualDiffCanvas.style.height = 'auto';
        
        // Generate visual diff
        if (userVisualCanvas && expectedVisualCanvas) {
          visualDiffCanvas.width = viewport.width;
          visualDiffCanvas.height = viewport.height + 80;
          
          const ctx = visualDiffCanvas.getContext('2d');
          
          // Clear canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, visualDiffCanvas.width, visualDiffCanvas.height);
          
          // Draw header
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Visual Diff - ${viewport.name}`, viewport.width / 2, 20);
          
          // Draw legend
          ctx.font = '10px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#e74c3c';
          ctx.fillText('■ Different', 10, 40);
          ctx.fillStyle = '#3498db';
          ctx.fillText('■ Missing', 80, 40);
          ctx.fillStyle = '#2c3e50';
          ctx.fillText('■ Matching', 140, 40);
          
          // Draw faded original
          ctx.globalAlpha = 0.3;
          ctx.drawImage(expectedVisualCanvas, 0, 80, viewport.width, viewport.height);
          ctx.globalAlpha = 1.0;
          
          // Generate and draw diff
          const diffImageData = ctx.createImageData(viewport.width, viewport.height);
          const userImageData = userVisualCanvas.getContext('2d').getImageData(0, 0, viewport.width, viewport.height);
          const expectedImageData = expectedVisualCanvas.getContext('2d').getImageData(0, 0, viewport.width, viewport.height);
          
          const diffPixels = pixelmatch(
            userImageData.data,
            expectedImageData.data,
            diffImageData.data,
            viewport.width,
            viewport.height,
            { threshold: 0.1, alpha: 0.8 }
          );
          
          ctx.putImageData(diffImageData, 0, 80);
          
          // Calculate visual scores for this viewport
          const pixelMatchScore = compareWithPixelMatch(userVisualCanvas, expectedVisualCanvas, true);
          const resembleScore = await compareWithResembleJS(userVisualCanvas, expectedVisualCanvas);
          const averageVisualScore = Math.round((pixelMatchScore + resembleScore) / 2);
          
          // Add diff count and scores
          ctx.font = '10px Arial';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'right';
          ctx.fillText(`${diffPixels} different pixels`, viewport.width - 10, 40);
          ctx.fillText(`Visual Score: ${averageVisualScore}%`, viewport.width - 10, 55);
          ctx.fillText(`(PM: ${pixelMatchScore}% | RJS: ${resembleScore}%)`, viewport.width - 10, 70);
        }
        
        visualDiffContainer.appendChild(visualDiffCanvas);

        // Layout Diff
        const layoutDiffContainer = document.createElement('div');
        layoutDiffContainer.style.textAlign = 'center';
        
        const layoutDiffTitle = document.createElement('h4');
        layoutDiffTitle.textContent = 'Layout Difference';
        layoutDiffTitle.style.color = '#9b59b6';
        layoutDiffTitle.style.marginBottom = '10px';
        layoutDiffContainer.appendChild(layoutDiffTitle);

        const layoutDiffCanvas = document.createElement('canvas');
        layoutDiffCanvas.id = `layout-diff-${viewport.name.toLowerCase()}`;
        layoutDiffCanvas.style.border = '1px solid #ddd';
        layoutDiffCanvas.style.borderRadius = '5px';
        layoutDiffCanvas.style.maxWidth = '100%';
        layoutDiffCanvas.style.height = 'auto';
        
        // Generate layout diff
        if (userLayoutCanvas && expectedLayoutCanvas) {
          layoutDiffCanvas.width = viewport.width;
          layoutDiffCanvas.height = viewport.height + 80;
          
          const ctx = layoutDiffCanvas.getContext('2d');
          
          // Clear canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, layoutDiffCanvas.width, layoutDiffCanvas.height);
          
          // Draw header
          ctx.fillStyle = '#2c3e50';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Layout Diff - ${viewport.name}`, viewport.width / 2, 20);
          
          // Draw legend
          ctx.font = '10px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#888';
          ctx.fillText('■ Match', 10, 40);
          ctx.fillStyle = '#e74c3c';
          ctx.fillText('■ User only', 60, 40);
          ctx.fillStyle = '#3498db';
          ctx.fillText('■ Expected only', 120, 40);
          ctx.fillStyle = '#9b59b6';
          ctx.fillText('■ Different', 200, 40);
          
          // Draw faded original
          ctx.globalAlpha = 0.3;
          ctx.drawImage(expectedLayoutCanvas, 0, 80, viewport.width, viewport.height);
          ctx.globalAlpha = 1.0;
          
          // Generate layout-specific diff (black pixels only)
          const diffImageData = ctx.createImageData(viewport.width, viewport.height);
          const userImageData = userLayoutCanvas.getContext('2d').getImageData(0, 0, viewport.width, viewport.height);
          const expectedImageData = expectedLayoutCanvas.getContext('2d').getImageData(0, 0, viewport.width, viewport.height);
          
          let diffPixels = 0;
          for (let i = 0; i < userImageData.data.length; i += 4) {
            const userR = userImageData.data[i];
            const userG = userImageData.data[i + 1];
            const userB = userImageData.data[i + 2];
            const userA = userImageData.data[i + 3];
            const expectedR = expectedImageData.data[i];
            const expectedG = expectedImageData.data[i + 1];
            const expectedB = expectedImageData.data[i + 2];
            const expectedA = expectedImageData.data[i + 3];
            
            // Check if either pixel is black (or very close to black)
            const blackThreshold = 50; // RGB values below this are considered black
            const userIsBlack = (userR < blackThreshold && userG < blackThreshold && userB < blackThreshold && userA > 128);
            const expectedIsBlack = (expectedR < blackThreshold && expectedG < blackThreshold && expectedB < blackThreshold && expectedA > 128);
            
            if (!userIsBlack && !expectedIsBlack) {
              // Neither pixel is black, ignore
              diffImageData.data[i] = 0;
              diffImageData.data[i + 1] = 0;
              diffImageData.data[i + 2] = 0;
              diffImageData.data[i + 3] = 0;
            } else if (!userIsBlack && expectedIsBlack) {
              // Expected has black pixel where user doesn't - blue
              diffImageData.data[i] = 52;
              diffImageData.data[i + 1] = 152;
              diffImageData.data[i + 2] = 219;
              diffImageData.data[i + 3] = 200;
              diffPixels++;
            } else if (userIsBlack && !expectedIsBlack) {
              // User has black pixel where expected doesn't - red
              diffImageData.data[i] = 231;
              diffImageData.data[i + 1] = 76;
              diffImageData.data[i + 2] = 60;
              diffImageData.data[i + 3] = 200;
              diffPixels++;
            } else {
              // Both have black pixels, check if they differ significantly
              const diff = Math.abs(userR - expectedR) + Math.abs(userG - expectedG) + Math.abs(userB - expectedB);
              if (diff < 30) {
                // Black pixels match closely - grey
                diffImageData.data[i] = 136;
                diffImageData.data[i + 1] = 136;
                diffImageData.data[i + 2] = 136;
                diffImageData.data[i + 3] = 150;
              } else {
                // Black pixels differ - purple
                diffImageData.data[i] = 155;
                diffImageData.data[i + 1] = 89;
                diffImageData.data[i + 2] = 182;
                diffImageData.data[i + 3] = 200;
                diffPixels++;
              }
            }
          }
          
          ctx.putImageData(diffImageData, 0, 80);
          
          // Calculate layout scores for this viewport
          const pixelMatchLayoutScore = compareLayoutWithPixelMatch(userLayoutCanvas, expectedLayoutCanvas, true);
          const resembleLayoutScore = await compareLayoutWithResembleJS(userLayoutCanvas, expectedLayoutCanvas);
          const averageLayoutScore = Math.round((pixelMatchLayoutScore + resembleLayoutScore) / 2);
          
          // Add diff count and scores
          ctx.font = '10px Arial';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'right';
          ctx.fillText(`${diffPixels} layout differences`, viewport.width - 10, 40);
          ctx.fillText(`Layout Score: ${averageLayoutScore}%`, viewport.width - 10, 55);
          ctx.fillText(`(PM: ${pixelMatchLayoutScore}% | RJS: ${resembleLayoutScore}%)`, viewport.width - 10, 70);
        }
        
        layoutDiffContainer.appendChild(layoutDiffCanvas);

        // Add both diffs to container
        diffsContainer.appendChild(visualDiffContainer);
        diffsContainer.appendChild(layoutDiffContainer);
        viewportSection.appendChild(diffsContainer);

        // Add score summary section
        const scoresSummary = document.createElement('div');
        scoresSummary.style.display = 'grid';
        scoresSummary.style.gridTemplateColumns = '1fr 1fr';
        scoresSummary.style.gap = '15px';
        scoresSummary.style.marginTop = '15px';
        scoresSummary.style.marginBottom = '10px';

        // Visual score summary
        const visualScoreSummary = document.createElement('div');
        visualScoreSummary.style.padding = '10px';
        visualScoreSummary.style.backgroundColor = '#e3f2fd';
        visualScoreSummary.style.borderRadius = '6px';
        visualScoreSummary.style.border = '1px solid #3498db';
        visualScoreSummary.style.textAlign = 'center';
        
        const visualScoreTitle = document.createElement('div');
        visualScoreTitle.textContent = '👁️ Visual Score';
        visualScoreTitle.style.fontWeight = 'bold';
        visualScoreTitle.style.color = '#2c3e50';
        visualScoreTitle.style.marginBottom = '5px';
        visualScoreTitle.style.fontSize = '14px';
        
        const visualScoreValue = document.createElement('div');
        if (userVisualCanvas && expectedVisualCanvas) {
          const pixelMatchScore = compareWithPixelMatch(userVisualCanvas, expectedVisualCanvas, true);
          const resembleScore = await compareWithResembleJS(userVisualCanvas, expectedVisualCanvas);
          const averageVisualScore = Math.round((pixelMatchScore + resembleScore) / 2);
          
          visualScoreValue.textContent = `${averageVisualScore}%`;
          visualScoreValue.style.fontSize = '20px';
          visualScoreValue.style.fontWeight = 'bold';
          applyScoreColor(visualScoreValue, averageVisualScore);
          
          const visualScoreDetails = document.createElement('div');
          visualScoreDetails.textContent = `PixelMatch: ${pixelMatchScore}% | ResembleJS: ${resembleScore}%`;
          visualScoreDetails.style.fontSize = '11px';
          visualScoreDetails.style.color = '#666';
          visualScoreDetails.style.marginTop = '3px';
          
          visualScoreSummary.appendChild(visualScoreTitle);
          visualScoreSummary.appendChild(visualScoreValue);
          visualScoreSummary.appendChild(visualScoreDetails);
        } else {
          visualScoreValue.textContent = 'Error';
          visualScoreValue.style.color = '#e74c3c';
          visualScoreSummary.appendChild(visualScoreTitle);
          visualScoreSummary.appendChild(visualScoreValue);
        }

        // Layout score summary
        const layoutScoreSummary = document.createElement('div');
        layoutScoreSummary.style.padding = '10px';
        layoutScoreSummary.style.backgroundColor = '#f3e5f5';
        layoutScoreSummary.style.borderRadius = '6px';
        layoutScoreSummary.style.border = '1px solid #9b59b6';
        layoutScoreSummary.style.textAlign = 'center';
        
        const layoutScoreTitle = document.createElement('div');
        layoutScoreTitle.textContent = '📐 Layout Score';
        layoutScoreTitle.style.fontWeight = 'bold';
        layoutScoreTitle.style.color = '#2c3e50';
        layoutScoreTitle.style.marginBottom = '5px';
        layoutScoreTitle.style.fontSize = '14px';
        
        const layoutScoreValue = document.createElement('div');
        if (userLayoutCanvas && expectedLayoutCanvas) {
          const pixelMatchLayoutScore = compareLayoutWithPixelMatch(userLayoutCanvas, expectedLayoutCanvas, true);
          const resembleLayoutScore = await compareLayoutWithResembleJS(userLayoutCanvas, expectedLayoutCanvas);
          const averageLayoutScore = Math.round((pixelMatchLayoutScore + resembleLayoutScore) / 2);
          
          layoutScoreValue.textContent = `${averageLayoutScore}%`;
          layoutScoreValue.style.fontSize = '20px';
          layoutScoreValue.style.fontWeight = 'bold';
          applyScoreColor(layoutScoreValue, averageLayoutScore);
          
          const layoutScoreDetails = document.createElement('div');
          layoutScoreDetails.textContent = `PixelMatch: ${pixelMatchLayoutScore}% | ResembleJS: ${resembleLayoutScore}%`;
          layoutScoreDetails.style.fontSize = '11px';
          layoutScoreDetails.style.color = '#666';
          layoutScoreDetails.style.marginTop = '3px';
          
          layoutScoreSummary.appendChild(layoutScoreTitle);
          layoutScoreSummary.appendChild(layoutScoreValue);
          layoutScoreSummary.appendChild(layoutScoreDetails);
        } else {
          layoutScoreValue.textContent = 'Error';
          layoutScoreValue.style.color = '#e74c3c';
          layoutScoreSummary.appendChild(layoutScoreTitle);
          layoutScoreSummary.appendChild(layoutScoreValue);
        }

        scoresSummary.appendChild(visualScoreSummary);
        scoresSummary.appendChild(layoutScoreSummary);
        viewportSection.appendChild(scoresSummary);

        // Add viewport info
        const viewportInfo = document.createElement('div');
        viewportInfo.style.textAlign = 'center';
        viewportInfo.style.fontSize = '12px';
        viewportInfo.style.color = '#666';
        viewportInfo.style.fontStyle = 'italic';
        viewportInfo.innerHTML = `Viewport: ${viewport.width}×${viewport.height} pixels`;
        viewportSection.appendChild(viewportInfo);

        viewportDiffsContainer.appendChild(viewportSection);
        
        console.log(`Generated diffs for ${viewport.name} successfully`);
        
      } catch (error) {
        console.error(`Error generating diffs for ${viewport.name}:`, error);
        
        // Create error section for this viewport
        const errorSection = document.createElement('div');
        errorSection.style.padding = '20px';
        errorSection.style.border = '2px solid #e74c3c';
        errorSection.style.borderRadius = '10px';
        errorSection.style.backgroundColor = '#fff5f5';
        errorSection.style.marginBottom = '20px';
        errorSection.style.textAlign = 'center';
        
        errorSection.innerHTML = `
          <h3 style="color: #e74c3c; margin-bottom: 10px;">${viewport.name} (${viewport.width}×${viewport.height})</h3>
          <p style="color: #666;">Error generating diffs: ${error.message}</p>
        `;
        
        viewportDiffsContainer.appendChild(errorSection);
      }
    }

    // Add explanation
    const explanation = document.createElement('div');
    explanation.style.marginTop = '20px';
    explanation.style.padding = '15px';
    explanation.style.backgroundColor = '#e8f4fd';
    explanation.style.borderRadius = '8px';
    explanation.style.fontSize = '14px';
    explanation.style.color = '#2c3e50';
    explanation.innerHTML = `
      <strong>📊 Viewport-Specific Analysis with Scores:</strong><br>
      • <strong>Visual Differences:</strong> Show pixel-level differences in colors, styling, and visual appearance with PixelMatch and ResembleJS scores<br>
      • <strong>Layout Differences:</strong> Show structural differences in element positioning and layout with dedicated layout scoring<br>
      • <strong>Individual Scores:</strong> Each viewport displays its own visual and layout scores for targeted analysis<br>
      • <strong>Score Breakdown:</strong> PM = PixelMatch algorithm, RJS = ResembleJS algorithm, with averaged final scores<br>
      • Compare differences and scores across viewports to identify responsive design issues
    `;
    viewportDiffsContainer.appendChild(explanation);

    console.log('All viewport diffs generated successfully');
    
    // Scroll to the new section
    viewportDiffsContainer.scrollIntoView({ behavior: 'smooth' });
    
    return true;
    
  } catch (error) {
    console.error('Error generating viewport diffs:', error);
    showToast('Error generating viewport diffs: ' + error.message, 'error');
    return false;
  }
}