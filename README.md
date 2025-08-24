# Roast Me (Softly) - Technical Documentation

## 1. Project Overview

Roast Me (Softly) is a web application designed to provide users with an entertaining and engaging roasting experience. The application features a clean, modern user interface and is built with a robust tech stack that ensures a seamless and responsive user experience. Users can sign in using their Google accounts to access the full range of features, including a personalized dashboard and the ability to participate in "roast" sessions.

## 2. Features

-   **Google Authentication**: Secure and easy sign-in with Google accounts.
-   **Theming**: Switch between light and dark modes for a personalized experience.
-   **Responsive UI**: A fully responsive design that works on all devices.
-   **Dashboard**: A personalized dashboard for authenticated users.
-   **Roast Sessions**: The core feature of the application where users can get "roasted."

## 3. Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
-   **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
-   **Language**: [TypeScript](https://www.typescriptlang.org/)

## 4. Architecture

The project follows the standard Next.js App Router architecture, which promotes a clear separation of concerns and a logical project structure. The application is divided into several key directories:

-   **`app/`**: Contains the core routing and layout of the application.
-   **`components/`**: Includes reusable UI components, both general-purpose and application-specific.
-   **`lib/`**: Houses utility functions and the Firebase integration layer.
-   **`store/`**: Manages global state using Zustand.

## 5. Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A Firebase project with Authentication and Firestore enabled.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/roast-me-softly.git
    cd roast-me-softly
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

1.  Create a `.env.local` file in the root of the project and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## 6. Code Structure

-   **`app/`**:
    -   [`layout.tsx`](app/layout.tsx:1): The root layout of the application.
    -   [`page.tsx`](app/page.tsx:15): The landing page for unauthenticated users.
    -   [`dashboard/`](app/dashboard): The user's personalized dashboard.
    -   [`roast/`](app/roast): The core "roasting" feature of the application.

-   **`components/`**:
    -   [`ui/`](components/ui): A collection of reusable UI components from `shadcn/ui`.
    -   [`Header.tsx`](components/Header.tsx): The main header of the application.
    -   [`providers.tsx`](components/providers.tsx): A centralized provider for various global contexts.

-   **`lib/`**:
    -   [`firebase.ts`](lib/firebase.ts): Initializes the Firebase app and exports Firebase services.
    -   [`auth.ts`](lib/auth.ts): Provides abstracted functions for authentication.
    -   [`utils.ts`](lib/utils.ts): Contains utility functions used across the application.

-   **`store/`**:
    -   [`auth-store.ts`](store/auth-store.ts): Manages authentication-related state.
    -   [`roast-store.ts`](store/roast-store.ts): Manages state related to the "roasting" functionality.
    -   [`theme-store.ts`](store/theme-store.ts): Manages the application's theme.

## 7. Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production-ready build.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase for errors.

## 8. Best Practices

-   **Component-Based Architecture**: Continue to build the UI with reusable and modular components.
-   **State Management**: Use Zustand for global state and React's built-in state management for local component state.
-   **Styling**: Adhere to the design system established by `shadcn/ui` and Tailwind CSS.
-   **Firebase**: Keep all Firebase-related logic in the `lib/` directory to maintain a clear separation of concerns.