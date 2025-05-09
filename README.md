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

## Deployment to Netlify

You can deploy this application to Netlify using one of the following methods:

### Method 1: Direct Deployment from Git

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Sign up or log in to [Netlify](https://app.netlify.com/)
3. Click "New site from Git" and select your repository
4. Use these build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

### Method 2: Manual Deployment

#### Option A: Using the Deploy Script
1. Make the script executable:
```bash
chmod +x build-and-deploy.sh
```

2. Run the script:
```bash
./build-and-deploy.sh
```

#### Option B: Manual Steps
1. Build the project locally:
```bash
npm run build
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Login to Netlify:
```bash
netlify login
```

4. Deploy the site:
```bash
netlify deploy --prod --dir=dist
```

### Method 3: Drag and Drop Deployment

1. Build the project locally:
```bash
npm run build
```

2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag and drop the `dist` folder to the designated area
4. Your site will be deployed instantly

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