# @naverpay/prometheus-hono

Hono 애플리케이션을 위한 Prometheus 메트릭 수집 미들웨어 및 라우터입니다.

## 설치

```bash
npm install @naverpay/prometheus-hono
```

## 주요 기능

### HTTP 메트릭 수집

- **요청 지속시간**: 모든 HTTP 요청의 응답 시간 측정
- **자동 라벨링**: 상태 코드, HTTP 메서드, 경로 자동 수집
- **경로 정규화**: 동적 라우트를 패턴으로 그룹화

### 스마트 필터링

- **자동 바이패스**: 헬스체크, 메트릭 엔드포인트 등 자동 제외
- **커스텀 필터**: 사용자 정의 바이패스 로직 지원
- **Next.js 지원**: Next.js 정적 파일 및 라우트 자동 처리

### API 트레이싱

- **전용 API 메트릭**: API 엔드포인트 전용 세밀한 모니터링
- **커스텀 상태 처리**: 비즈니스 로직 기반 상태 분류
- **404 핸들링**: API 미매칭 요청 자동 처리

### 유연한 설정

- **경로 정규화**: 커스텀 경로 그룹화 함수
- **상태 코드 포맷팅**: 사용자 정의 상태 분류
- **PM2 통합**: 클러스터 환경에서 메트릭 집계
- **Standalone 모드**: PM2 없이 단일 프로세스에서도 메트릭 수집

## 빠른 시작

### 기본 설정 (Standalone 모드)

```typescript
import { Hono } from 'hono'
import { createHonoPrometheusExporter } from '@naverpay/prometheus-hono'

const app = new Hono()

// 단일 프로세스 환경 (Docker, K8s 등)
const { middleware, router, disconnect } = await createHonoPrometheusExporter({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
})

// 미들웨어 등록
app.use('*', middleware)

// 다른 라우터들...
app.get('/', (c) => c.text('Hello!'))

// 메트릭 라우터
app.route('/', router)

export default app
```

### PM2 클러스터 모드

```typescript
const { middleware, router, disconnect } = await createHonoPrometheusExporter({
  pm2: true, // PM2 클러스터 메트릭 집계 활성화
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
})

app.use('*', middleware)
app.route('/', router)

// 서버 종료 시 정리
process.on('SIGTERM', async () => {
  await disconnect()
})
```

### 메트릭 수집 비활성화 (개발 환경)

```typescript
const { middleware, router } = await createHonoPrometheusExporter({
  enabled: process.env.NODE_ENV === 'production',
  metricsPath: '/metrics',
})

// enabled: false일 경우 noop 미들웨어/라우터 반환
app.use('*', middleware)
app.route('/', router)
```

## API 참조

### `createHonoPrometheusExporter(options)`

Hono Prometheus 익스포터를 생성합니다.

#### 옵션

```typescript
interface HonoPrometheusExporterOptions {
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
  middleware: MiddlewareHandler
  /** 메트릭 엔드포인트 라우터 (Hono 앱) */
  router: Hono
  /** 연결 해제 함수 */
  disconnect: () => Promise<void>
}
```

### API 트레이싱

#### `createHonoApiTraceMiddleware(options?)`

API 전용 트레이싱 미들웨어를 생성합니다.

```typescript
import { createHonoApiTraceMiddleware } from '@naverpay/prometheus-hono'

const { startApiTrace, writeApiTrace, endApiTrace } = createHonoApiTraceMiddleware({
  normalizePath: (context) => {
    const url = new URL(context.req.url)
    return url.pathname.replace(/\/api\/v\d+/, '/api/v*')
  }
})

// API 라우터에서 사용
const api = new Hono()

// 모든 API 요청에 트레이싱 시작
api.use('*', startApiTrace)

// API 라우트들...
api.get('/users/:id', async (c) => {
  const user = await getUser(c.req.param('id'))
  writeApiTrace(c)
  return c.json(user)
})

// 404 처리 (매칭되지 않은 API 요청)
api.all('*', (c) => endApiTrace(c))
```

### 라우터 유틸리티

#### `createNormalizedHonoRouterPath(app, prefix?)`

Hono 앱의 경로를 정규화하는 함수를 생성합니다.

```typescript
import { Hono } from 'hono'
import { createNormalizedHonoRouterPath } from '@naverpay/prometheus-hono'

const app = new Hono()
app.get('/users/:id', handler)
app.get('/posts/:id/comments', handler)

const normalizeUrl = createNormalizedHonoRouterPath(app)

console.log(normalizeUrl('/users/123')) // '/users/:id'
console.log(normalizeUrl('/posts/456/comments')) // '/posts/:id/comments'
```

## 고급 설정

### 커스텀 바이패스

```typescript
const { middleware } = await createHonoPrometheusExporter({
  bypass: (context) => {
    // 특정 헤더가 있는 요청 제외
    if (context.req.header('X-Health-Check')) return true

    // 특정 User-Agent 제외
    if (context.req.header('User-Agent')?.includes('monitoring')) return true

    return false
  }
})
```

### 동적 경로 정규화

```typescript
const { middleware } = await createHonoPrometheusExporter({
  normalizePath: (context) => {
    const url = new URL(context.req.url)
    let path = url.pathname

    // UUID 패턴을 :id로 변경
    path = path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')

    // 숫자 ID를 :id로 변경
    path = path.replace(/\/\d+/g, '/:id')

    return path
  }
})
```

### 비즈니스 로직 기반 상태 분류

```typescript
const { middleware } = await createHonoPrometheusExporter({
  formatStatusCode: (context) => {
    const status = context.res.status
    if (status >= 500) return 'system_error'
    if (status >= 400) return 'client_error'
    if (status >= 300) return 'redirect'
    if (status === 201) return 'created'
    if (status === 204) return 'no_content'
    return 'success'
  }
})
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

## 모드 비교

| 모드 | `enabled` | `pm2` | 사용 환경 |
|------|-----------|-------|-----------|
| 비활성화 | `false` | - | 개발 환경, 메트릭 불필요 시 |
| Standalone | `true` | `false` | Docker, K8s, 단일 프로세스 |
| PM2 클러스터 | `true` | `true` | PM2 클러스터 환경 |

## 요구 사항

- Node.js 18.0.0 이상
- TypeScript 4.5 이상
- Hono 4.0.0 이상

## 라이센스

MIT License
