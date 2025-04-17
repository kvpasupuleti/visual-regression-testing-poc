# Visual Regression Testing POC

This project demonstrates a browser-based visual regression testing tool for web development assessments. It allows you to:

1. Test UI exactness percentage between user code and solution code
2. Show visual differences between the user's implementation and the expected output
3. Provide scoring based on visual similarity and functional correctness
4. Test the end-to-end flow of user interactions within the browser

## Features

- Visual diffing using both PixelMatch and ResembleJS
- E2E testing of user interaction flows
- Scoring system that combines visual and functional correctness
- Real-time feedback in the browser

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

## Usage

1. The interface provides three editors for HTML, CSS, and JavaScript code
2. Pre-populated sample code is provided for a simple Todo application
3. Click "Run Code" to see your implementation
4. Click "Run Visual Test" to compare your implementation with the expected output
5. View the visual diff, scores, and test results

## Integration with Assessment Platform

To integrate this into your assessment platform:

1. Load solution code from your database instead of the hardcoded example
2. Modify the scoring weights and testing logic to match your assessment criteria
3. Add API endpoints to save and retrieve user submissions
4. Implement authentication and user session management

## Technologies Used

- HTML5, CSS3, JavaScript
- html2canvas for capturing DOM screenshots
- pixelmatch and ResembleJS for visual diffing
- Parcel for bundling 