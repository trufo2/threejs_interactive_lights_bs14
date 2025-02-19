import restart from 'vite-plugin-restart'
import {defineConfig} from 'vite'

export default defineConfig(({ command }) => ({
    root: 'src/',
    publicDir: command === 'build' ? '../staticBuild/' : '../static/',
    assetsInclude: ['**/*.glb'],
    server:
    {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
    },
    build:
    {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false
    },
    plugins: [restart({restart: ['../static/**',]})]
}))