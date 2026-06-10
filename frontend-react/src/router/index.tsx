import { Link, Outlet, createBrowserRouter } from 'react-router-dom';

function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link className="text-sm font-semibold tracking-wide text-white" to="/">
            frontend-react
          </Link>
          <span className="text-xs text-slate-400">React migration scaffold</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">frontend-react</h1>
      <p className="max-w-2xl text-sm leading-6 text-slate-300">
        Vite, React, TypeScript, Tailwind, TanStack Query, Zustand, and the shared UI primitives are ready for the
        migration work.
      </p>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
  } as any,
});
