import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bound to 0.0.0.0 on purpose: this project is meant to be run INSIDE the WSL2/VM test loop
// (see ../vm/run-in-wsl.sh) and viewed from the Windows host over the forwarded port, not just
// from inside the VM itself. Binding to localhost-only would make that forwarding invisible.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
