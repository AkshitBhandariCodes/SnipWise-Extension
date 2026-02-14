import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'popup.html'),
                options: resolve(__dirname, 'options.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                content: resolve(__dirname, 'src/content/index.tsx'),
                background: resolve(__dirname, 'src/background/service-worker.ts'),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'background') {
                        return 'background.js';
                    }
                    if (chunkInfo.name === 'content') {
                        return 'content.js';
                    }
                    return 'assets/[name].js';
                },
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
    },
});
