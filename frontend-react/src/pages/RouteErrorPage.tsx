import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định.';
}

export default function RouteErrorPage() {
  const error = useRouteError();
  const message = getErrorMessage(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
          <AlertTriangle size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-white">Không tải được màn hình</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Ứng dụng gặp lỗi khi hiển thị màn hình này. Bạn có thể tải lại hoặc quay về dashboard.
        </p>
        <p className="mt-4 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400">{message}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            onClick={() => window.location.reload()}
            type="button"
          >
            <RefreshCcw size={16} />
            Tải lại
          </button>
          <Link
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
            to="/"
          >
            <Home size={16} />
            Về dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
