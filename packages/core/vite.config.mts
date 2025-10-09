import {createViteConfig} from '@naverpay/pite'

import type {UserConfig} from 'vite'

const config: UserConfig = createViteConfig({
    cwd: '.',
    entry: ['./src/index.ts'],
    skipRequiredPolyfillCheck: ['es.array.push', 'esnext.json.parse'],
    options: {
        minify: false,
    },
})

export default config
