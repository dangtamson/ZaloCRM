import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the scaffold home page', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'frontend-react' })).toBeInTheDocument();
  });
});
