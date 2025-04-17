// Test runner for shopping cart assessment

import { solutionHTML, solutionCSS, solutionJS, testScenarios } from './solution.js';

class ShoppingCartTestRunner {
  constructor(userHTML, userCSS, userJS) {
    this.userHTML = userHTML;
    this.userCSS = userCSS;
    this.userJS = userJS;
    this.testResults = [];
    this.visualSimilarity = 0;
    this.functionalScore = 0;
  }

  // Initialize iframes with user and solution code
  async setupEnvironments() {
    // Setup user iframe
    const userFrame = document.getElementById('user-output');
    const userDoc = userFrame.contentDocument;
    userDoc.open();
    userDoc.write(`
      ${this.userHTML}
      <style>${this.userCSS}</style>
      <script>${this.userJS}</script>
    `);
    userDoc.close();

    // Setup solution iframe
    const solutionFrame = document.getElementById('expected-output');
    const solutionDoc = solutionFrame.contentDocument;
    solutionDoc.open();
    solutionDoc.write(`
      ${solutionHTML}
      <style>${solutionCSS}</style>
      <script>${solutionJS}</script>
    `);
    solutionDoc.close();

    // Wait for both documents to fully load
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  // Run E2E tests on user's implementation
  async runFunctionalTests() {
    const userFrame = document.getElementById('user-output');
    const userDoc = userFrame.contentDocument;
    const userWin = userFrame.contentWindow;

    this.testResults = [];
    let passedTests = 0;

    for (const scenario of testScenarios) {
      const result = {
        name: scenario.name,
        passed: true,
        steps: []
      };

      try {
        for (const step of scenario.steps) {
          const stepResult = {
            type: step.type,
            passed: false,
            details: ''
          };

          if (step.type === 'click') {
            const element = userDoc.querySelector(step.selector);
            if (!element) {
              stepResult.passed = false;
              stepResult.details = `Element not found: ${step.selector}`;
              result.passed = false;
            } else {
              element.click();
              await new Promise(resolve => setTimeout(resolve, 300));
              stepResult.passed = true;
              stepResult.details = `Clicked on ${step.selector}`;
            }
          } else if (step.type === 'check') {
            const element = userDoc.querySelector(step.selector);
            if (!element) {
              stepResult.passed = false;
              stepResult.details = `Element not found: ${step.selector}`;
              result.passed = false;
            } else {
              if (step.expectItems !== undefined) {
                const items = element.querySelectorAll('.cart-item').length;
                stepResult.passed = items === step.expectItems;
                stepResult.details = `Expected ${step.expectItems} items, found ${items}`;
              } else if (step.expectText !== undefined) {
                stepResult.passed = element.textContent.includes(step.expectText);
                stepResult.details = stepResult.passed ? 
                  `Found text: "${step.expectText}"` : 
                  `Text "${step.expectText}" not found in "${element.textContent}"`;
              } else if (step.expectValue !== undefined) {
                stepResult.passed = element.value === step.expectValue;
                stepResult.details = `Expected value "${step.expectValue}", found "${element.value}"`;
              }
              
              if (!stepResult.passed) {
                result.passed = false;
              }
            }
          }
          
          result.steps.push(stepResult);
        }
      } catch (error) {
        result.passed = false;
        result.error = error.message;
      }

      this.testResults.push(result);
      if (result.passed) {
        passedTests++;
      }
    }

    // Calculate overall functional score (percentage of passed tests)
    this.functionalScore = Math.round((passedTests / testScenarios.length) * 100);
    return this.functionalScore;
  }

  // Calculate visual similarity
  async calculateVisualSimilarity(pixelMatchScorer, resembleScorer) {
    // Capture screenshots of both iframes
    const userFrame = document.getElementById('user-output');
    const userDoc = userFrame.contentDocument.body;
    const userCanvas = await html2canvas(userDoc);
    
    const solutionFrame = document.getElementById('expected-output');
    const solutionDoc = solutionFrame.contentDocument.body;
    const solutionCanvas = await html2canvas(solutionDoc);
    
    // Calculate visual similarity using both methods
    const pixelMatchScore = pixelMatchScorer(userCanvas, solutionCanvas);
    const resembleScore = await resembleScorer(userCanvas, solutionCanvas);
    
    // Average both scores
    this.visualSimilarity = Math.round((pixelMatchScore + resembleScore) / 2);
    return this.visualSimilarity;
  }

  // Generate overall score and report
  generateScore() {
    // Calculate total score (40% visual, 60% functional)
    const totalScore = Math.round(this.visualSimilarity * 0.4 + this.functionalScore * 0.6);
    
    return {
      visualScore: this.visualSimilarity,
      functionalScore: this.functionalScore,
      totalScore: totalScore,
      testResults: this.testResults
    };
  }
}

export default ShoppingCartTestRunner; 