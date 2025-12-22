import type {MiddlewareHandler} from 'hono'

/**
 * Creates a no-operation middleware that does nothing
 * @returns Hono middleware that simply calls next()
 */
export function getHonoNoopMiddleware(): MiddlewareHandler {
    return (_context, next) => {
        return next()
    }
}
