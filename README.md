# Code Quality Analyzer

![Next.js](https://img.shields.io/badge/Next.js-13.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.5.2-blue.svg)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Improvements](#improvements)

## Introduction

**Code Quality Analyzer** is a Next.js application designed to evaluate the quality of code snippets from GitHub repositories. By leveraging GitHub's API to fetch specific files and OpenAI's powerful language models, this tool provides users with a comprehensive analysis, including a quality score and detailed reasoning. This helps developers maintain high coding standards and identify areas for improvement within their codebases. Feel free to go test the product at [Code Quality Analyzer](https://code-quality-analyzer.vercel.app/)

## Features

- **GitHub Integration:** Fetches file contents from specified repositories and commit SHAs.
- **Code Analysis:** Utilizes OpenAI's GPT-4o-mini model to assess code quality.
- **Session Management:** Implements authentication using NextAuth for secure access.
- **History Tracking:** Stores and displays a history of analyzed code snippets using `localStorage`.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/en/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later) or [Yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Jaurasma/Code_Quality_Analyzer.git code_quality_analyzer
   cd code_quality_analyzer
   ```

2. **Install Dependencies**

   Using npm:

   ```bash
   npm install
   ```

   Or using Yarn:

   ```bash
   yarn install
   ```

### Environment Variables

Create a `.env.local` file in the root directory of the project and add the following environment variables:

```env
# GitHub OAuth Credentials
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# NextAuth Secret
NEXTAUTH_SECRET=your-nextauth-secret

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000
```

**Note:** Replace `your-github-client-id`, `your-github-client-secret`, `your-nextauth-secret`, and `your-openai-api-key` with your actual credentials. Ensure that these keys are kept secure and **never** commit them to version control.

### Running the Application

Start the development server:

Using npm:

```bash
npm run dev
```

Or using Yarn:

```bash
yarn dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

To build the application for production:

Using npm:

```bash
npm run build
```

Or using Yarn:

```bash
yarn build
```

Start the production server:

Using npm:

```bash
npm start
```

Or using Yarn:

```bash
yarn start
```

## Technologies Used

- **[Next.js](https://nextjs.org/):** React framework for server-rendered applications.
- **[TypeScript](https://www.typescriptlang.org/):** Superset of JavaScript for static typing.
- **[NextAuth](https://next-auth.js.org/):** Authentication for Next.js applications.
- **[Axios](https://axios-http.com/):** Promise-based HTTP client for the browser and Node.js.
- **[OpenAI API](https://openai.com/api/):** AI models for generating responses.
- **[ESLint](https://eslint.org/):** Linting utility for JavaScript and TypeScript.
- **[Prettier](https://prettier.io/):** Code formatter.
- **[Docker](https://www.docker.com/):** Containerization platform for consistent development and deployment environments.

## Project Structure

```
code-quality-analyzer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── Providers.tsx
├── components/
│   ├── AuthButtons.tsx
│   ├── CodeQualityForm.tsx
│   ├── SignInButton.tsx
│   ├── SignOutButton.tsx
│   ├── UserMenu.tsx
│   ├── UserProfile.tsx
│   ├── CodeQualityForm.tsx
│   └── FilePicker.tsx
├── pages/
│   ├── api/
│   │   ├── analyze.tsx
│   │   ├── getFileSha.tsx
│   │   ├── analyze.tsx
│   │   └── auth/
│   │       └── [...nextauth].tsx
│   └── _app_.tsx
├── utils/
│   ├── analyzeCodeWithLLM.tsx
│   └── localStorageUtils.tsx
├── types/
│   ├── github.ts
│   └── types.ts
├── styles/
│   └── globals.css
├── .env.local
├── .eslintrc.js
├── package.json
├── tsconfig.json
└── README.md
```

**Key Directories and Files:**

- **`components/`:** Contains React components and their respective tests.
- **`pages/api/`:** Contains Next.js API routes and authentication configuration.
- **`utils/`:** Houses utility functions and their tests.
- **`types/`:** Defines TypeScript interfaces and types.
- **`styles/`:** Contains global and component-specific CSS files.
- **`.eslintrc.js`:** ESLint configuration.
- **`README.md`:** Project documentation.

## Improvements

While **Code Quality Analyzer** is functional and robust, there are several areas planned for future enhancement:

- **Testing:**
  - **Unit Testing:** Implement comprehensive unit tests using [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) to ensure component reliability and facilitate maintainability.
  - **Integration Testing:** Develop integration tests to validate the interaction between different parts of the application, ensuring seamless data flow and functionality.

- **Docker Implementaion:**
  - **Dockerfile:** Dockerize the project to ensure that it runs on all machines.

- **Enhanced Error Handling and Logging:**
  - **User Feedback:** Improve error messages and user notifications to provide clearer guidance during failures.
  - **Logging:** Implement advanced logging mechanisms using tools like [Winston](https://github.com/winstonjs/winston) or [LogRocket](https://logrocket.com/) for better monitoring and debugging.

- **User Interface Enhancements:**
  - **Responsive Design:** Further refine the UI to ensure optimal display across a wider range of devices and screen sizes.
  - **Accessibility Improvements:** Ensure the application meets accessibility standards (e.g., WCAG) to provide an inclusive experience for all users.

- **Security Enhancements:**
  - **Input Validation:** Strengthen input validation to prevent potential security vulnerabilities.
  - **Dependency Audits:** Regularly audit and update dependencies to mitigate security risks associated with outdated packages.

- **Additional Features:**
  - **Export Analysis Results:** Allow users to export their analysis reports in formats like PDF or Markdown.
