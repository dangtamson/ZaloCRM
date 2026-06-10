# ZaloCRM Vue Frontend

Đây là frontend Vue legacy hiện vẫn được Docker production build mặc định.

Trong quá trình migration, app React mới nằm ở `../frontend-react` và chạy song song. Không xóa dependency Vue/Vuetify/Pinia hoặc đổi Docker sang React cho tới khi có sign-off parity.

## Development

```bash
npm install
npm run dev
npm run build
```
