import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Security headers injected by the dev server to match production behaviour.
    // Developers test against the same policy so CSP violations surface early.
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
      // Dev CSP — allows 'unsafe-inline' for Vite HMR hot module replacement.
      // Production CSP (without 'unsafe-inline') is enforced by the backend middleware.
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:* ws://127.0.0.1:*",
        "object-src 'none'",
        "frame-ancestors 'none'",
      ].join("; "),
    },
    // To enable HTTPS in development, generate a self-signed cert and set:
    // https: { key: './localhost-key.pem', cert: './localhost.pem' }
    // Use: npx @vitejs/plugin-basic-ssl  — or  mkcert localhost
  },
});
