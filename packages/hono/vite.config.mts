import {createViteConfig} from '@naverpay/pite'

import type {UserConfig} from 'vite'

const config: UserConfig = createViteConfig({
    cwd: '.',
    entry: './src/index.ts',
    options: {
        minify: false,
    },
})

export default config
