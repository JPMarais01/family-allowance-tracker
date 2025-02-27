import { describe, it, expect } from 'vitest';
import { render, screen } from './test/utils';
import App from './App';

describe('App', () => {
  it('renders the App with Vite and React links', () => {
    render(<App />);

    // Check if the Vite and React logos are present
    expect(screen.getByAltText('Vite logo')).toBeInTheDocument();
    expect(screen.getByAltText('React logo')).toBeInTheDocument();

    // Check if the title is present
    expect(screen.getByText('Vite + React')).toBeInTheDocument();

    // Check if the counter button is present
    expect(screen.getByRole('button', { name: /count is/i })).toBeInTheDocument();
  });
});
