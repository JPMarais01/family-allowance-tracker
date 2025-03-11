# Family Allowance Tracker - Project Plan

## Project Overview

The Family Allowance Tracker is a web application designed to help parents track their children's behavior and helpfulness on a daily basis. Parents can rate each child's performance on a scale of 1-5 daily, mark vacation days with default scores, and generate monthly summaries for allowance calculations. The application follows a custom budget cycle (25th of one month to the 24th of the next) and provides separate interfaces for parents and children.

The application aims to:

- Replace manual tracking systems with a digital solution
- Create transparency in how allowances are calculated
- Foster motivation for children to help around the house
- Provide an easy-to-use interface accessible from any device
- Maintain a history of performance over time

---

## Features

### Core Features

1. **User Authentication**

- Secure login for parents with admin privileges
- Simple login for children with limited view access
- Password protection for family data

2. **Daily Scoring System**

- 1-5 rating scale for each child
- Optional notes field for context
- Visual indicators of scoring trends

3. **Vacation Day Management**

- Mark days as "vacation" with a default score (3)
- Bulk selection for longer vacation periods
- Visual differentiation of vacation days in the calendar

4. **Custom Budget Cycle**

- Monthly periods from 25th to 24th of next month
- Automatic calculation of monthly averages
- Summary generation for allowance determination

5. **Dashboards**

- Parent dashboard with scoring controls
- Child dashboard showing personal progress
- Visual representations of performance trends

### Additional Features (Future Development)

1. **Achievement System**

- Badges for consistent good scores
- Milestone recognition

2. **Notification System**

- Daily reminders to input scores
- End-of-cycle summary alerts

---

## Technology Stack

### Frontend

- **React.js** - Core UI framework
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Router** - Navigation management
- **React Query** - Data fetching and state management
- **Recharts** - Data visualization
- **date-fns** - Date manipulation

### Backend

- **Supabase** - Authentication and database
  - Auth module for user management
  - PostgreSQL database for data storage
  - Row-level security for data protection

### Deployment

- **GitHub** - Code repository
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Static site hosting

---

## Project Structure

```text
family-allowance-tracker/
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── test/
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase
│   ├── initial_schema.sql
│   ├── config.toml
│   └── migrations/
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Implementation Steps

### Phase 1: Project Setup and Foundation - COMPLETE

1. **Initialize React Application** - COMPLETE

   - Create a new React app with Vite.
   - Provide a fast development environment with modern tooling.
   - Establish basic project folder/file structure.

2. **Install Core Dependencies** - COMPLETE

   - Integrate libraries for UI, state management, and data fetching (e.g., React Query, Chakra UI).
   - Include additional libraries for date formatting, routing, and data visualization.
   - Ensure that all packages match the desired technology stack.

3. **Setup Supabase Integration** - COMPLETE

   - Configure a Supabase client to handle Auth and database interactions.
   - Create environment variables for Supabase keys.
   - Verify connectivity between frontend and Supabase services.

4. **Create Database Schema** - COMPLETE

   - Define tables for families, family members, daily scores, and settings.
   - Add necessary constraints and relationships for robust data management.
   - Implement row-level security policies to ensure appropriate data access.

5. **Set Up GitHub Actions for Deployment** - COMPLETE

   - Configure CI/CD to run builds on every push to the main branch.
   - Automate deployment to GitHub Pages or another desired platform.
   - Confirm that environment variables are properly set for production builds.

---

### Phase 2: Authentication and Core Functionality

1. **Implement Authentication System** - COMPLETE

   - Provide login forms for parent and child accounts.
   - Maintain a global authentication state using a context provider.
   - React to Supabase auth changes to keep user sessions updated.
   - Restrict pages based on user roles (parent/child).

2. **Create Family Management** - COMPLETE

   - Provide a way to create a new family (owner and basic details).
   - Add or invite children to the family with assigned roles.
   - List/manage existing family members and update their information.

3. **Create Scoring System** - COMPLETE

   - Store daily scores, notes, and optional vacation status for each child.
   - Support updating scores if they already exist for a particular date.
   - Invalidate and refetch relevant data upon score changes (using React Query).

4. **Build Calendar Interface**

   - Display a full monthly or weekly calendar view for each child's scores.
   - Offer a click or tap-based UI to open a daily score input form.
   - Visually highlight vacation days and differentiate them from normal days.

---

### Phase 3: Cycle Management and Reports

1. **Implement Budget Cycle Logic**

   - Manage dates and calculations for a custom cycle running from the 25th to the 24th.
   - Include utility methods to retrieve current or specific-month cycle start/end dates.
   - Accommodate edge cases for new months and year boundaries.

2. **Create Monthly Summary Component**

   - Generate reports showing daily scores, average performance, and partial allowance calculations.
   - Summarize each child's data over a given period (e.g., monthly or custom cycle).
   - Present aggregated performance statistics (like average scores).

3. **Create Vacation Day Selection**

   - Provide a bulk date-selection interface to mark multiple days as vacation.
   - Assign a default score for vacation days.
   - Persist these details in daily score records.

---

### Phase 4: Final Components and Integration

1. **Implement Dashboard Components**

   - Build a parent dashboard for viewing all children, entering daily scores, and managing allowances/trends.
   - Provide quick stats (e.g., average scores for the last 7/30 days or current cycle).
   - Include multiple tabs or sections within the dashboard for calendar, trend charts, and vacation settings.

2. **Create Child Dashboard**

   - Offer a simplified view for a logged-in child showing their own progress and a summary of recent scores.
   - Display score history and cumulative performance in an easy-to-read format.
   - Motivate consistent participation through visual progress indicators (e.g., star icons).

3. **Build Data Visualization**

   - Use chart components to graph daily scores across a time range.
   - Toggle between different date ranges (last month, last 3 months, current budget cycle).
   - Clearly indicate days without scores or those marked as vacation.

4. **Add Allowance Calculation**

   - Expose utility functions that compute final allowance based on base allowance and average score performance.
   - Integrate logic into monthly/weekly summaries and dashboards.
   - Display real-time allowance progress and final calculated amounts.

---

### Phase 5: Final Integration and Deployment

1. **Set Up Routing and Navigation**

   - Configure a router to define paths for login, dashboards, settings, and child-specific routes.
   - Ensure child routes are protected by appropriate role-based guards.
   - Set up a single-page application fallback for deployment on GitHub Pages.

2. **Create Settings Page**
   - Provide edit forms for family settings (e.g., cycle start day, default vacation score).
   - Allow adding/editing children and their allowances from one organized place.
   - Maintain ease of updating family-wide configuration without intrusive code changes.

---

## Testing Plan

1. **Unit Testing**

   - Test individual utility functions
   - Test hooks in isolation
   - Test component rendering

2. **Integration Testing**

   - Test authentication flow
   - Test data fetching and mutations
   - Test budget cycle calculations

3. **End-to-End Testing**

   - Test complete user flows
   - Test mobile and desktop responsiveness
   - Test offline functionality

---

## Launch Checklist

1. **Pre-Launch**

   - Complete all core functionality
   - Review and fix any bugs
   - Test on mobile and desktop devices
   - Ensure proper error handling

2. **Launch**

   - Deploy to GitHub Pages
   - Configure Supabase production environment
   - Set up CI/CD pipeline

3. **Post-Launch**

   - Monitor for any issues
   - Gather initial feedback
   - Plan next iteration of features

---

## Timeline

1. **Week 1: Setup and Foundation** (Tasks 1-5)

   - Initialize project and install dependencies
   - Set up Supabase integration
   - Design database schema
   - Configure CI/CD

2. **Week 2: Core Functionality** (Tasks 6-10)

   - Implement authentication
   - Create family management
   - Build scoring system
   - Develop calendar interface

3. **Week 3: Advanced Features** (Tasks 11-17)

   - Implement budget cycle logic
   - Create monthly summary
   - Build vacation day selection
   - Add data visualization

4. **Week 4: Integration and Testing** (Tasks 18-22)

   - Set up routing and navigation
   - Create settings page
   - Design responsive layout
   - Finalize deployment
   - Conduct testing and bug fixes

This detailed plan provides a roadmap for implementing the Family Allowance Tracker web app. By following these structured steps, you'll be able to build a functional, user-friendly application that helps parents track their children's allowances based on their daily behavior scores.
