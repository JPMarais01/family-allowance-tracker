# CLAUDE.md - Commands and Guidelines

## Commands

```bash
# Development
npm run dev         # Start development server

# Build and Validate
npm run build       # Build for production
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Run Prettier
npm run format:check # Check formatting with Prettier
npm run preview     # Preview production build

# Testing
npm test            # Run tests once
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ui     # Run tests with UI viewer
```

## Code Style Guidelines

- **TypeScript**: Use strong typing for all variables, parameters, and returns
- **Imports**: Group imports by external libraries, internal modules, types
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use try-catch for async operations, display user feedback
- **Component Structure**: Use functional components with hooks
- **State Management**: Prefer React Query for server state, context for app state
- **CSS**: Use Chakra UI with consistent theme variables
- **Testing**: Component testing with React Testing Library
- **Documentation**: JSDoc for utility functions
