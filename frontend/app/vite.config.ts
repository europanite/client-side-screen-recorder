import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages is served at /<repository-name>/, local development at /.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  plugins: [react()],
  base: repository ? `/${repository}/` : '/',
});
