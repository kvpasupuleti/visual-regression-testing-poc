/**
 * Assessment Runner for Platform Integration
 * 
 * This file demonstrates how to integrate the visual regression testing 
 * and E2E testing functionality into your assessment platform.
 */

import html2canvas from 'html2canvas';
import pixelmatch from 'pixelmatch';
import ResembleJS from 'resemblejs';

class AssessmentRunner {
  constructor() {
    this.assessments = {}; // Store loaded assessments
    this.visualScoreWeight = 0.4;
    this.functionalScoreWeight = 0.6;
  }

  /**
   * Register an assessment with the runner
   * @param {string} id - Unique assessment ID
   * @param {Object} assessment - Assessment object with solution code and test scenarios
   */
  registerAssessment(id, assessment) {
    this.assessments[id] = assessment;
  }

  /**
   * Run tests for a specific assessment
   * @param {string} assessmentId - ID of the assessment to run
   * @param {string} userHTML - User's HTML code
   * @param {string} userCSS - User's CSS code
   * @param {string} userJS - User's JavaScript code
   * @returns {Promise<Object>} - Test results
   */
  async runTests(assessmentId, userHTML, userCSS, userJS) {
    const assessment = this.assessments[assessmentId];
    
    if (!assessment) {
      throw new Error(`Assessment with ID ${assessmentId} not found`);
    }

    // Setup test environments
    const { userFrame, solutionFrame } = await this.setupEnvironments(
      userHTML, userCSS, userJS,
      assessment.solutionHTML, assessment.solutionCSS, assessment.solutionJS
    );

    // Run functional tests
    const functionalResults = await this.runFunctionalTests(
      userFrame, 
      assessment.testScenarios
    );

    // Calculate visual similarity
    const visualScore = await this.calculateVisualSimilarity(
      userFrame, 
      solutionFrame
    );

    // Calculate total score
    const totalScore = Math.round(
      visualScore * this.visualScoreWeight + 
      functionalResults.score * this.functionalScoreWeight
    );

    // Generate visual diff image
    const diffImageUrl = await this.generateDiffImage(
      userFrame, 
      solutionFrame
    );

    return {
      assessmentId,
      visualScore,
      functionalScore: functionalResults.score,
      totalScore,
      testResults: functionalResults.testResults,
      diffImageUrl
    };
  }

  /**
   * Setup test environments in iframes
   * @private
   */
  async setupEnvironments(userHTML, userCSS, userJS, solutionHTML, solutionCSS, solutionJS) {
    // Create iframes for testing
    const userFrame = document.createElement('iframe');
    userFrame.style.display = 'none';
    document.body.appendChild(userFrame);

    const solutionFrame = document.createElement('iframe');
    solutionFrame.style.display = 'none';
    document.body.appendChild(solutionFrame);

    // Setup user iframe
    const userDoc = userFrame.contentDocument;
    userDoc.open();
    userDoc.write(`
      ${userHTML}
      <style>${userCSS}</style>
      <script>${userJS}</script>
    `);
    userDoc.close();

    // Setup solution iframe
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
        resolve({ userFrame, solutionFrame });
      }, 1000);
    });
  }

  /**
   * Run functional tests
   * @private
   */
  async runFunctionalTests(userFrame, testScenarios) {
    const userDoc = userFrame.contentDocument;
    const testResults = [];
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
                const items = element.querySelectorAll(step.itemSelector || '.item').length;
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

      testResults.push(result);
      if (result.passed) {
        passedTests++;
      }
    }

    // Calculate overall functional score (percentage of passed tests)
    const score = Math.round((passedTests / testScenarios.length) * 100);
    
    return {
      score,
      testResults
    };
  }

  /**
   * Calculate visual similarity between user and solution
   * @private
   */
  async calculateVisualSimilarity(userFrame, solutionFrame) {
    // Capture screenshots of both iframes
    const userDoc = userFrame.contentDocument.body;
    const userCanvas = await html2canvas(userDoc);
    
    const solutionDoc = solutionFrame.contentDocument.body;
    const solutionCanvas = await html2canvas(solutionDoc);
    
    // Calculate visual similarity using both methods
    const pixelMatchScore = this.compareWithPixelMatch(userCanvas, solutionCanvas);
    const resembleScore = await this.compareWithResembleJS(userCanvas, solutionCanvas);
    
    // Average both scores
    return Math.round((pixelMatchScore + resembleScore) / 2);
  }

  /**
   * Compare screenshots using PixelMatch
   * @private
   */
  compareWithPixelMatch(userCanvas, expectedCanvas) {
    const width = Math.max(userCanvas.width, expectedCanvas.width);
    const height = Math.max(userCanvas.height, expectedCanvas.height);
    
    // Create canvas for diff
    const diffCanvas = document.createElement('canvas');
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
    
    // Calculate mismatch percentage
    const totalPixels = width * height;
    const matchPercentage = 100 - (mismatchedPixels / totalPixels * 100);
    
    return Math.round(matchPercentage);
  }

  /**
   * Compare screenshots using ResembleJS
   * @private
   */
  compareWithResembleJS(userCanvas, expectedCanvas) {
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

  /**
   * Generate a diff image showing visual differences
   * @private
   */
  async generateDiffImage(userFrame, solutionFrame) {
    // Capture screenshots
    const userDoc = userFrame.contentDocument.body;
    const userCanvas = await html2canvas(userDoc);
    
    const solutionDoc = solutionFrame.contentDocument.body;
    const solutionCanvas = await html2canvas(solutionDoc);
    
    // Create diff canvas
    const width = Math.max(userCanvas.width, solutionCanvas.width);
    const height = Math.max(userCanvas.height, solutionCanvas.height);
    
    const diffCanvas = document.createElement('canvas');
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
    expectedContext.drawImage(solutionCanvas, 0, 0);
    const expectedImageData = expectedContext.getImageData(0, 0, width, height);
    
    // Compare the images
    pixelmatch(
      userImageData.data,
      expectedImageData.data,
      diffImageData.data,
      width,
      height,
      { threshold: 0.1 }
    );
    
    // Create diff image
    diffContext.putImageData(diffImageData, 0, 0);
    return diffCanvas.toDataURL();
  }

  /**
   * Clean up resources after testing
   */
  cleanup() {
    // Remove any iframes or other elements created during testing
    const iframes = document.querySelectorAll('iframe[style="display: none;"]');
    iframes.forEach(iframe => iframe.remove());
  }
}

export default AssessmentRunner; 