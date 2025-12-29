# GEMINI.md

## Project Overview

This is a React Native mobile application designed for learning English C1 level words. The application is built using Expo, a framework for building universal React applications. It features a quiz-based learning system, tracks user statistics, and allows for user-configurable settings.

**Key Technologies:**

*   **React Native:** A JavaScript framework for building native mobile apps.
*   **Expo:** A platform and toolset for building and deploying React Native apps.
*   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
*   **React Navigation:** A library for routing and navigation in React Native applications.
*   **AsyncStorage:** A simple, unencrypted, asynchronous, persistent, key-value storage system for React Native.

**Architecture:**

The application is structured with a bottom tab navigator that provides access to three main screens:

*   **QuizScreen:** The core of the application, where users can answer quiz questions to learn new words. It dynamically generates questions and options, and provides feedback to the user. It also uses a smart algorithm to select words based on the user's past performance.
*   **StatsScreen:** Displays user statistics, such as the number of correct and incorrect answers.
*   **SettingsScreen:** Allows users to configure application settings.

The application's data, including words and sentences, is stored in JSON files in the `src/data` directory. User statistics are stored locally on the device using AsyncStorage.

## Building and Running

To build and run the project, follow these steps:

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Start the application:**

    ```bash
    npx expo start
    ```

    This will open the Expo developer tools in your browser. You can then run the app on a physical device using the Expo Go app or on a simulator (Android or iOS).

**Other available commands:**

*   `npm run android`: Starts the app on a connected Android device or emulator.
*   `npm run ios`: Starts the app on an iOS simulator.
*   `npm run web`: Starts the app in a web browser.
*   `npm run lint`: Lints the code using ESLint.

## Development Conventions

*   **File-based routing:** The project uses file-based routing with Expo Router.
*   **Styling:** The application uses StyleSheet for styling components.
*   **Data:** The application's data is stored in JSON files.
*   **State Management:** The application uses React's built-in state management (`useState`, `useEffect`) and AsyncStorage for persistent storage.
*   **Coding Style:** The code is written in TypeScript and follows the standard React Native coding conventions. The code is also well-commented in Turkish.
