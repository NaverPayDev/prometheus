import type {Middleware} from 'koa'

/**
 * Creates a no-operation middleware that does nothing
 * @returns Koa middleware that simply calls next()
 */
export function getKoaNoopMiddleware(): Middleware {
    return (_context, next) => {
        return next()
    }
}
