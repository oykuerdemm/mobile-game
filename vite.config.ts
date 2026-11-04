import { defineConfig } from 'vite';

export default defineConfig({
  base: '/mobile-game/',
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
});
