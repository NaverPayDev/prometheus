# @naverpay/prometheus-koa

Koa.js 애플리케이션을 위한 Prometheus 메트릭 수집 미들웨어 및 라우터입니다.

## 설치

```bash
npm install @naverpay/prometheus-koa
```

## 주요 기능

### 🎯 HTTP 메트릭 수집

- **요청 지속시간**: 모든 HTTP 요청의 응답 시간 측정
- **자동 라벨링**: 상태 코드, HTTP 메서드, 경로 자동 수집
- **경로 정규화**: 동적 라우트를 패턴으로 그룹화

### 🚦 스마트 필터링

- **자동 바이패스**: 헬스체크, 메트릭 엔드포인트 등 자동 제외
- **커스텀 필터**: 사용자 정의 바이패스 로직 지원
- **Next.js 지원**: Next.js 정적 파일 및 라우트 자동 처리

### 📊 API 트레이싱

- **전용 API 메트릭**: API 엔드포인트 전용 세밀한 모니터링
- **커스텀 상태 처리**: 비즈니스 로직 기반 상태 분류
- **404 핸들링**: API 미매칭 요청 자동 처리

### 🔧 유연한 설정

- **경로 정규화**: 커스텀 경로 그룹화 함수
- **상태 코드 포맷팅**: 사용자 정의 상태 분류
- **PM2 통합**: 클러스터 환경에서 메트릭 집계

## 빠른 시작

### 기본 설정 (Standalone 모드)

```typescript
import Koa from 'koa'
import { createKoaPrometheusExporter } from '@naverpay/prometheus-koa'

const app = new Koa()

// 단일 프로세스 환경 (Docker, K8s 등)
const { middleware, router, disconnect } = await createKoaPrometheusExporter({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
})

// 미들웨어 등록 (모든 라우터보다 먼저 등록)
app.use(middleware)

// 다른 라우터들...
app.use(someOtherRouter.routes())

// 메트릭 라우터 (가장 마지막에 등록)
app.use(router.routes())

const server = app.listen(3000)

// 서버 종료 시 정리
process.on('SIGTERM', async () => {
  await disconnect()
  server.close()
})
```

### PM2 클러스터 모드

```typescript
const { middleware, router, disconnect } = await createKoaPrometheusExporter({
  pm2: true, // PM2 클러스터 메트릭 집계 활성화
  metricsPath: '/metrics',
})

app.use(middleware)
app.use(router.routes())

process.on('SIGTERM', async () => {
  await disconnect()
})
```

### 메트릭 수집 비활성화 (개발 환경)

```typescript
const { middleware, router } = await createKoaPrometheusExporter({
  enabled: process.env.NODE_ENV === 'production',
  metricsPath: '/metrics',
})

// enabled: false일 경우 noop 미들웨어/라우터 반환
app.use(middleware)
app.use(router.routes())
```

## API 참조

### `createKoaPrometheusExporter(options)`

Koa Prometheus 익스포터를 생성합니다.

#### 옵션

```typescript
interface KoaPrometheusExporterOptions {
  /** 메트릭 수집 활성화 여부 (기본값: true) */
  enabled?: boolean
  /** PM2 클러스터링 지원 (기본값: false) */
  pm2?: boolean
  /** Next.js 라우트 정규화 활성화 */
  nextjs?: boolean
  /** 메트릭 엔드포인트 경로 */
  metricsPath?: string
  /** 기본 Node.js 메트릭 수집 */
  collectDefaultMetrics?: boolean
  /** 요청 바이패스 함수 */
  bypass?: (context: Context) => boolean
  /** 경로 정규화 함수 */
  normalizePath?: (context: Context) => string
  /** 상태 코드 포맷팅 함수 */
  formatStatusCode?: (context: Context) => string
}
```

#### 반환값

```typescript
{
  /** 메트릭 수집 미들웨어 */
  middleware: Middleware
  /** 메트릭 엔드포인트 라우터 */
  router: Router
  /** 연결 해제 함수 */
  disconnect: () => Promise<void>
}
```

### API 트레이싱

#### `createKoaApiTraceMiddleware(options?)`

API 전용 트레이싱 미들웨어를 생성합니다.

```typescript
import { createKoaApiTraceMiddleware } from '@naverpay/prometheus-koa'

const { startApiTrace, writeApiTrace, endApiTrace } = createKoaApiTraceMiddleware({
  normalizePath: (context) => {
    // API 경로 정규화 로직
    return context.path.replace(/\/api\/v\d+/, '/api/v*')
  }
})

// API 라우터에서 사용
const apiRouter = new Router({ prefix: '/api' })

// 모든 API 요청에 트레이싱 시작
apiRouter.use(startApiTrace)

// API 라우트들...
apiRouter.get('/users/:id', async (context) => {
  // 비즈니스 로직...
  context.status = 200
  context.body = { user: 'data' }
  
  // 메트릭 기록
  writeApiTrace(context)
})

// 404 처리 (매칭되지 않은 API 요청)
apiRouter.all('(.*)', endApiTrace)
```

### 라우터 유틸리티

#### `createNormalizedKoaRouterPath(router, prefix?)`

Koa 라우터의 경로를 정규화하는 함수를 생성합니다.

```typescript
import Router from '@koa/router'
import { createNormalizedKoaRouterPath } from '@naverpay/prometheus-koa'

const router = new Router()
router.get('/users/:id', handler)
router.get('/posts/:id/comments', handler)

const normalizeUrl = createNormalizedKoaRouterPath(router)

console.log(normalizeUrl('/users/123')) // '/users/:id'
console.log(normalizeUrl('/posts/456/comments')) // '/posts/:id/comments'
```

## 고급 설정

### 커스텀 바이패스

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  bypass: (context) => {
    // 특정 헤더가 있는 요청 제외
    if (context.get('X-Health-Check')) return true
    
    // 특정 User-Agent 제외
    if (context.get('User-Agent')?.includes('monitoring')) return true
    
    // 개발 환경에서 webpack 요청 제외
    if (process.env.NODE_ENV === 'development' && 
        context.path.startsWith('/__webpack')) return true
    
    return false
  }
})
```

### 동적 경로 정규화

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  normalizePath: (context) => {
    let path = context.path
    
    // UUID 패턴을 :id로 변경
    path = path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    
    // 숫자 ID를 :id로 변경
    path = path.replace(/\/\d+/g, '/:id')
    
    // 파일 확장자를 :file로 변경
    path = path.replace(/\/[^/]+\.(jpg|png|gif|css|js)$/i, '/:file')
    
    return path
  }
})
```

### 비즈니스 로직 기반 상태 분류

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  formatStatusCode: (context) => {
    // 비즈니스 에러와 시스템 에러 분리
    if (context.status >= 500) return 'system_error'
    if (context.status >= 400) return 'client_error'
    if (context.status >= 300) return 'redirect'
    
    // 성공 응답을 세분화
    if (context.status === 201) return 'created'
    if (context.status === 204) return 'no_content'
    return 'success'
  }
})
```

### API 전용 모니터링

```typescript
import Router from '@koa/router'
import { createKoaApiTraceMiddleware } from '@naverpay/prometheus-koa'

const apiRouter = new Router({ prefix: '/api/v1' })

const { startApiTrace, writeApiTrace, endApiTrace } = createKoaApiTraceMiddleware({
  normalizePath: (context) => {
    // API 버전 정규화
    return context.path.replace(/\/api\/v\d+/, '/api/v*')
  }
})

// 모든 API 요청에 트레이싱 적용
apiRouter.use(startApiTrace)

// 각 엔드포인트에서 메트릭 기록
apiRouter.get('/users', async (context) => {
  try {
    const users = await getUserList()
    context.body = users
    context.status = 200
  } catch (error) {
    context.status = 500
    context.body = { error: 'Internal Server Error' }
  }
  
  writeApiTrace(context)
})

// 404 핸들링
apiRouter.all('(.*)', endApiTrace)
```

## 수집되는 메트릭

### HTTP 요청 메트릭 (`http_request_duration_seconds`)

모든 HTTP 요청의 응답 시간을 히스토그램으로 수집합니다.

**라벨:**

- `status_code`: HTTP 상태 코드 (그룹화됨)
- `method`: HTTP 메서드 (GET, POST, etc.)
- `path`: 정규화된 요청 경로

### API 요청 메트릭 (`http_api_request_duration_seconds`)

API 트레이싱 미들웨어가 활성화된 경우 수집됩니다.

**라벨:**

- `path`: 정규화된 API 경로
- `status`: 응답 상태
- `method`: HTTP 메서드

### 서비스 상태 메트릭 (`up`)

서비스 가용성을 나타내는 게이지 메트릭입니다.

- `1`: 서비스 실행 중
- `0`: 서비스 중단

## 모범 사례

### 1. 미들웨어 순서

```typescript
const app = new Koa()

// 1. 메트릭 미들웨어 (가장 먼저)
app.use(metricsMiddleware)

// 2. 에러 핸들러
app.use(errorHandler)

// 3. 로깅 미들웨어
app.use(loggingMiddleware)

// 4. 비즈니스 로직 라우터들
app.use(apiRouter.routes())
app.use(webRouter.routes())

// 5. 메트릭 엔드포인트 라우터 (가장 마지막)
app.use(metricsRouter.routes())
```

### 2. 카디널리티 관리

```typescript
// 좋은 예: 제한된 값들
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  normalizePath: (context) => {
    // 동적 ID를 파라미터로 변경
    return context.path.replace(/\/\d+/g, '/:id')
  },
  formatStatusCode: (context) => {
    // 상태 코드를 그룹화
    if (context.status >= 500) return 'error'
    if (context.status >= 400) return 'client_error'
    return 'success'
  }
})

// 나쁜 예: 무제한 값들
const badConfig = {
  normalizePath: (context) => {
    return context.path // 모든 고유 경로를 개별 메트릭으로 생성
  },
  formatStatusCode: (context) => {
    return context.status.toString() // 모든 상태 코드를 개별적으로
  }
}
```

### 3. 성능 최적화

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  bypass: (context) => {
    // 정적 파일 요청 빠르게 제외
    if (context.path.includes('.')) return true
    
    // 자주 호출되는 헬스체크 제외
    if (context.path === '/health') return true
    
    return false
  }
})
```

## 문제 해결

### PM2 연결 실패

```typescript
// PM2 클러스터 환경에서만 pm2: true로 설정
const { middleware } = await createKoaPrometheusExporter({
  pm2: process.env.PM2_HOME !== undefined,
  // 다른 설정들...
})
```

### 개발 환경에서 메트릭 비활성화

```typescript
const { middleware } = await createKoaPrometheusExporter({
  enabled: process.env.NODE_ENV === 'production',
})
```

### 메트릭 엔드포인트 접근 불가

```typescript
// 메트릭 라우터가 다른 라우터보다 뒤에 위치해야 함
app.use(businessRouter.routes())
app.use(metricsRouter.routes()) // 마지막에 추가
```

### 높은 카디널리티 경고

메트릭 라벨의 고유 조합이 너무 많으면 메모리 사용량이 증가합니다. 경로 정규화를 통해 해결하세요.

## 요구 사항

- Node.js 16.0.0 이상
- TypeScript 4.5 이상
- Koa 2.0.0 이상

## 라이센스

MIT License
