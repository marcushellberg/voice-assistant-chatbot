import { UserConfigFn } from 'vite';
import { overrideVaadinConfig } from './vite.generated';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const customConfig: UserConfigFn = (env) => ({
  // Here you can add custom Vite parameters
  // https://vitejs.dev/config/
  css: {
    postcss: {
      plugins: [
        tailwind(),
        autoprefixer(),
      ],
    },
  },
});

export default overrideVaadinConfig(customConfig);
