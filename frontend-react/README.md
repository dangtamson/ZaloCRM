# ZaloCRM React Frontend

Frontend React + TypeScript + Tailwind chạy song song với Vue app trong `../frontend`.

## Commands

```bash
npm install
npm run dev -- --host 127.0.0.1
npm test
npm run build
npx playwright test --list
```

## Scope

React app dùng cùng backend API base `/api/v1`. Vite dev server mặc định chạy ở port `5174` và proxy `/api`, `/automation-assets`, `/socket.io` về backend `http://localhost:3000`. Production Docker vẫn build Vue frontend cho tới khi có sign-off parity và cutover rõ ràng.

Migration plan: `../docs/superpowers/plans/2026-06-10-frontend-react-parallel-migration.md`.
