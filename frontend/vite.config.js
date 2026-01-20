import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3001',
                    changeOrigin: true
                },
                '/socket.io': {
                    target: env.VITE_WS_URL || 'ws://localhost:3001',
                    ws: true
                }
            }
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'markdown': ['markdown-it', 'highlight.js'],
                        'katex': ['katex'],
                        'mermaid': ['mermaid'],
                        'collaboration': ['yjs', 'y-websocket']
                    }
                }
            }
        }
    };
});
