import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { authStore } from '../store/auth';
import { createMemoryAppRouter } from './index';

function renderRoute(path: string) {
  return render(<RouterProvider router={createMemoryAppRouter([path])} />);
}

describe('React app routing shell', () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.setState({ token: '', user: null });
    window.innerWidth = 1280;
  });

  it('redirects unauthenticated users from protected routes to login', async () => {
    renderRoute('/contacts');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('keeps authenticated users on protected routes inside the desktop layout', async () => {
    authStore.setState({
      token: 'token',
      user: {
        id: 'user-1',
        email: 'owner@example.com',
        fullName: 'Owner User',
        role: 'owner',
        orgId: 'org-1',
        orgName: 'VNPT',
      },
    });

    renderRoute('/contacts');

    expect(await screen.findByTestId('default-layout')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
  });

  it('uses the mobile layout on narrow screens', async () => {
    window.innerWidth = 420;
    authStore.setState({
      token: 'token',
      user: {
        id: 'user-1',
        email: 'owner@example.com',
        fullName: 'Owner User',
        role: 'owner',
        orgId: 'org-1',
        orgName: 'VNPT',
      },
    });

    renderRoute('/chat');

    expect(await screen.findByTestId('mobile-layout')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
  });

  it('redirects legacy settings tab URLs to the new nested route', async () => {
    authStore.setState({
      token: 'token',
      user: {
        id: 'user-1',
        email: 'owner@example.com',
        fullName: 'Owner User',
        role: 'owner',
        orgId: 'org-1',
        orgName: 'VNPT',
      },
    });

    renderRoute('/settings?tab=scoring');

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Settings.Scoring' })).toBeInTheDocument());
  });
});
