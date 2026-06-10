import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the unauthenticated login route by default', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });
});
