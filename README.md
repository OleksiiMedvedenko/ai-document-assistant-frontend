# AI Document Assistant Frontend

Modern React frontend for the **AI Document Assistant** platform.

This application provides a clean user interface for working with AI-powered document workflows such as uploading files, chatting with document content, generating summaries, comparing documents, and managing user access.

## Overview

The frontend is built as a standalone SPA and communicates with the backend API to handle:

- authentication and session-aware UI
- document upload and document list management
- AI chat with uploaded documents
- document summarization
- document comparison
- account area and admin area
- multilingual UI

The project is designed with a modular structure so features can evolve independently without turning the codebase into one large monolith.

## Main Features

- **Authentication flow**
  - sign in / access-controlled routes
  - auth bootstrap on app startup
  - user-aware navigation and protected areas

- **Documents**
  - upload documents
  - browse uploaded files
  - remove documents
  - work with multiple supported file types

- **AI Workflows**
  - ask questions about document content
  - generate summaries
  - compare two documents
  - use custom prompts

- **User Experience**
  - dark/light theme persistence
  - responsive interface
  - reusable UI components
  - loading and feedback states

- **Internationalization**
  - English
  - Polish
  - Ukrainian

- **Admin Area**
  - dedicated admin pages
  - user and access-related management UI

## Tech Stack

### Core

- **React 19**
- **TypeScript**
- **Vite**

### Routing and Data

- **React Router**
- **@tanstack/react-query**
- **Axios**

### Forms and Validation

- **react-hook-form**
- **Zod**
- **@hookform/resolvers**

### State and UI Utilities

- **Zustand**
- **Lucide React**
- **clsx**
- **tailwind-merge**

### Internationalization

- **i18next**
- **react-i18next**

## Project Structure

```text
src/
  app/
    api/           # API clients and request helpers
    components/    # shared UI components
    features/      # feature modules and pages
    lib/           # utilities and helpers
    providers/     # app-level providers
    router/        # route configuration
    store/         # Zustand stores
    styles/        # feature/page styles
  i18n/
    resources/     # translation dictionaries
    index.ts       # i18n configuration
  assets/
  main.tsx
```
