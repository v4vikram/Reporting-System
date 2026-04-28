# Enterprise Reporting System

A comprehensive full-stack platform for managing, designing, and publishing professional enterprise reports.

## 🚀 Features

### 📊 Dashboard & Management
*   **Real-time Insights**: Overview of active projects, client distributions, and report statuses.
*   **Role-Based Access Control (RBAC)**: Support for Super Admin, Admin, and Client roles.
*   **Client & Employee Management**: Centralized hub for managing organization users and their permissions.

### 📝 Report Orchestration
*   **Dynamic Sections**: Add, remove, and reorder report sections with drag-and-drop.
*   **Standard Layouts**: Structured table-based data entry for consistent reporting.
*   **Draft & Published Workflow**: Control report visibility and lifecycle.

### 🎨 Advanced Cover Page Designer (Canvas API)
*   **Multi-Page A4 Editor**: Design multiple introductory pages with precise A4 layout ratios.
*   **Interactive Elements**:
    *   Flexible Text blocks with double-click editing.
    *   Geometric shapes (Rectangles, Circles, Lines).
    *   High-quality Image uploads.
*   **Creative Tools**:
    *   **Undo/Redo System**: Full history tracking with `Ctrl+Z` / `Ctrl+Y` support.
    *   **Live Color Picker**: Real-time feedback for consistent branding.
    *   **Page Management**: Quickly Duplicate or Remove sheets.
*   **Optimized UX**:
    *   Fixed, sticky toolbars for easy access during vertical scrolling.
    *   Glass-morphism UI for a clean, professional aesthetic.
    *   Auto-expanding workspace that adapts to content volume.

## 🛠 Tech Stack

### Frontend
*   **React 18** + **Vite**
*   **Tailwind CSS**: Modern utility-first styling.
*   **Konva.js (react-konva)**: High-performance 2D canvas engine.
*   **React Query**: Efficient server state management and caching.
*   **Lucide React**: Clean, consistent icon set.
*   **Framer Motion**: Smooth interface transitions.

### Backend
*   **Node.js** + **Express**
*   **MongoDB** + **Mongoose**: Robust NoSQL data modeling.
*   **JWT Authentication**: Secure user sessions.
*   **Zod**: Schema validation for both frontend and backend.

## 📁 Project Structure

*   `/client`: React frontend application.
*   `/server`: Express backend API and database models.
*   `/shared`: Shared types and validation schemas.

## 📝 Ongoing Development
*   [x] Multi-page cover layout system.
*   [x] Undo/Redo history for creative tools.
*   [x] Optimization of the sticky sidebar for document editing.
*   [ ] PDF export engine for the final report generation.
*   [ ] Real-time collaboration for team editing.
