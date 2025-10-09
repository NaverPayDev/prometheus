# @naverpay/prometheus-next

Next.js 애플리케이션을 위한 통합 Prometheus 메트릭 수집 서버입니다.

## 설치

```bash
npm install @naverpay/prometheus-next
```

## 주요 기능

### 🚀 통합 서버
- **올인원**: Next.js 서버와 메트릭 수집이 하나의 서버로 통합
- **자동 설정**: 메트릭 수집을 위한 별도 설정 없이 즉시 사용 가능
- **내장 엔드포인트**: `/metrics` 엔드포인트 자동 생성

### 🎯 Next.js 최적화
- **라우트 정규화**: Next.js 라우트 매니페스트 기반 자동 경로 그룹화
- **정적 파일 처리**: `_next/` 및 정적 파일 요청 자동 분류
- **동적 라우트**: `[id]`, `[...slug]` 등 동적 라우트 자동 인식

### 🔄 PM2 클러스터 지원
- **멀티 프로세스**: PM2 클러스터 환경에서 메트릭 자동 집계
- **분산 수집**: 각 워커 프로세스의 메트릭을 통합
- **고가용성**: 프로세스 장애 시에도 다른 프로세스의 메트릭 수집 지속

### 🚦 스마트 필터링
- **자동 바이패스**: 웹팩 HMR, 중복 슬래시 등 자동 제외
- **커스텀 필터**: 사용자 정의 바이패스 로직 지원
- **성능 최적화**: 불필요한 요청의 메트릭 수집 방지

## 빠른 시작

### 기본 설정

```typescript
import { createNextServerWithMetrics } from '@naverpay/prometheus-next'

const server = await createNextServerWithMetrics({
  pm2: true, // PM2 환경에서 실행
  nextOptions: {
    dev: process.env.NODE_ENV !== 'production',
    port: 3000,
  },
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
})

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
  console.log('Metrics available at http://localhost:3000/metrics')
})

// 서버 종료 시 정리
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})
```

### 개발 환경 설정

```typescript
import { createNextServerWithMetrics } from '@naverpay/prometheus-next'

const server = await createNextServerWithMetrics({
  pm2: false, // 개발 환경에서는 PM2 비활성화
  nextOptions: {
    dev: true,
    turbo: true, // Turbopack 사용
  },
  metricsPath: '/dev-metrics',
  collectDefaultMetrics: false, // 개발 시 성능을 위해 비활성화
})

server.listen(3000)
```

### 프로덕션 설정

```typescript
import { createNextServerWithMetrics } from '@naverpay/prometheus-next'

const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: {
    dev: false,
    // Next.js 빌드 결과를 사용
  },
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  
  // 프로덕션 최적화
  bypass: (request, response) => {
    // 헬스체크 제외
    if (request.url === '/health') return true
    
    // 로드밸런서 헬스체크 제외
    const userAgent = request.headers['user-agent']
    if (userAgent?.includes('ELB-HealthChecker')) return true
    
    return false
  },
  
  // 커스텀 경로 정규화
  normalizePath: (request, response) => {
    let path = request.url || ''
    
    // API 버전 정규화
    path = path.replace(/\/api\/v\d+/, '/api/v*')
    
    // 쿼리 파라미터 제거
    path = path.split('?')[0] || path
    
    return path
  },
  
  // 응답 상태 분류
  formatStatusCode: (response) => {
    if (response.statusCode >= 500) return 'server_error'
    if (response.statusCode >= 400) return 'client_error'
    if (response.statusCode >= 300) return 'redirect'
    return 'success'
  }
})

server.listen(process.env.PORT || 3000)
```

## API 참조

### `createNextServerWithMetrics(options)`

메트릭 수집이 통합된 Next.js 서버를 생성합니다.

#### 옵션

```typescript
interface NextjsPrometheusExporterOptions {
  /** PM2 클러스터링 지원 */
  pm2: boolean
  /** Next.js 서버 설정 */
  nextOptions: NextServerOptions & {
    turbo?: boolean
    turbopack?: boolean
  }
  /** 메트릭 엔드포인트 경로 */
  metricsPath?: string
  /** 기본 Node.js 메트릭 수집 */
  collectDefaultMetrics?: boolean
  /** 요청 바이패스 함수 */
  bypass?: (request: IncomingMessage, response: ServerResponse) => boolean
  /** 경로 정규화 함수 */
  normalizePath?: (request: IncomingMessage, response: ServerResponse) => string
  /** 상태 코드 포맷팅 함수 */
  formatStatusCode?: (response: ServerResponse) => string
}
```

#### 반환값

```typescript
/** Node.js HTTP 서버 인스턴스 */
Server
```

## 고급 설정

### 커스텀 바이패스

```typescript
const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  bypass: (request, response) => {
    const url = request.url || ''
    const userAgent = request.headers['user-agent'] || ''
    
    // 봇 트래픽 제외
    if (/bot|crawler|spider/i.test(userAgent)) return true
    
    // 프리플라이트 요청 제외
    if (request.method === 'OPTIONS') return true
    
    // 웹소켓 업그레이드 요청 제외
    if (request.headers.upgrade === 'websocket') return true
    
    // 특정 도메인의 요청만 수집
    const host = request.headers.host
    if (!host?.includes('api.example.com')) return true
    
    return false
  }
})
```

### 동적 라우트 정규화

```typescript
const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  normalizePath: (request, response) => {
    let path = request.url?.split('?')[0] || ''
    
    // Next.js API 라우트 정규화
    if (path.startsWith('/api/')) {
      // /api/users/123 -> /api/users/[id]
      path = path.replace(/\/api\/users\/\d+/, '/api/users/[id]')
      
      // /api/posts/abc-123/comments -> /api/posts/[slug]/comments
      path = path.replace(/\/api\/posts\/[^/]+\/comments/, '/api/posts/[slug]/comments')
    }
    
    // 페이지 라우트는 Next.js 매니페스트 사용 (자동 처리됨)
    
    return path
  }
})
```

### 에러 상태 세분화

```typescript
const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  formatStatusCode: (response) => {
    const status = response.statusCode
    
    // 서버 에러 세분화
    if (status >= 500) {
      if (status === 502) return 'bad_gateway'
      if (status === 503) return 'service_unavailable'
      if (status === 504) return 'gateway_timeout'
      return 'server_error'
    }
    
    // 클라이언트 에러 세분화
    if (status >= 400) {
      if (status === 401) return 'unauthorized'
      if (status === 403) return 'forbidden'
      if (status === 404) return 'not_found'
      if (status === 429) return 'rate_limited'
      return 'client_error'
    }
    
    // 성공 응답 세분화
    if (status >= 200 && status < 300) {
      if (status === 201) return 'created'
      if (status === 202) return 'accepted'
      if (status === 204) return 'no_content'
      return 'success'
    }
    
    return 'redirect'
  }
})
```

## Next.js 통합 기능

### 자동 라우트 정규화

Next.js의 `routes-manifest.json`을 활용하여 자동으로 라우트를 정규화합니다:

```typescript
// 실제 요청 -> 정규화된 라벨
'/user/123'           -> '/user/[id]'
'/posts/abc-def'      -> '/posts/[slug]'
'/api/users/456'      -> '/api/users/[id]'
'/blog/2023/12/post'  -> '/blog/[...slug]'
'/_next/static/...'   -> 'STATIC'
'/favicon.ico'        -> 'STATIC'
```

### 개발 환경 최적화

개발 환경에서는 불필요한 요청들이 자동으로 제외됩니다:

```typescript
// 자동으로 바이패스되는 요청들
'/_next/webpack-hmr'     // 웹팩 HMR
'//double-slash'         // 잘못된 URL
'/metrics'               // 메트릭 엔드포인트
'/healthcheck'           // 헬스체크
```

## PM2 배포 예시

### PM2 ecosystem 파일

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'next-app-with-metrics',
    script: './dist/server.js',
    instances: 'max', // CPU 코어 수만큼 인스턴스 생성
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 메트릭 수집을 위한 설정
    wait_ready: true,
    listen_timeout: 10000,
  }]
}
```

### 서버 스크립트

```typescript
// server.ts
import { createNextServerWithMetrics } from '@naverpay/prometheus-next'

async function start() {
  const server = await createNextServerWithMetrics({
    pm2: true,
    nextOptions: {
      dev: false,
    },
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
  })

  const port = process.env.PORT || 3000
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`)
    
    // PM2에게 준비 완료 신호 전송
    if (process.send) {
      process.send('ready')
    }
  })
  
  // 우아한 종료
  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0)
    })
  })
}

start().catch(console.error)
```

## 수집되는 메트릭

### HTTP 요청 메트릭 (`http_request_duration_seconds`)

모든 HTTP 요청의 응답 시간을 히스토그램으로 수집합니다.

**라벨:**
- `status_code`: HTTP 상태 코드 그룹
- `method`: HTTP 메서드
- `path`: 정규화된 요청 경로

**예시 메트릭:**
```
http_request_duration_seconds_bucket{status_code="200",method="GET",path="/",le="0.1"} 145
http_request_duration_seconds_bucket{status_code="200",method="GET",path="/user/[id]",le="0.5"} 23
http_request_duration_seconds_bucket{status_code="4xx",method="GET",path="/api/not-found",le="1"} 5
```

### 서비스 상태 메트릭 (`up`)

서비스 가용성을 나타내는 게이지 메트릭입니다.

```
up 1
```

### 기본 Node.js 메트릭

`collectDefaultMetrics: true`일 때 다음 메트릭들이 추가로 수집됩니다:

- `process_cpu_user_seconds_total`
- `process_cpu_system_seconds_total`
- `process_resident_memory_bytes`
- `process_heap_bytes`
- `nodejs_eventloop_lag_seconds`
- `nodejs_gc_duration_seconds`

## 모니터링 설정

### Prometheus 설정

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'next-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### Grafana 대시보드

주요 모니터링 지표:

1. **응답 시간 분포**: `http_request_duration_seconds` 히스토그램
2. **요청 속도**: `rate(http_request_duration_seconds_count[5m])`
3. **에러율**: `rate(http_request_duration_seconds_count{status_code!="success"}[5m])`
4. **서비스 가용성**: `up`

## 성능 고려사항

### 1. 메트릭 카디널리티 관리

```typescript
// 좋은 예: 제한된 라벨 값
const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  normalizePath: (req) => {
    // ID를 파라미터로 변경
    return req.url?.replace(/\/\d+/g, '/[id]') || ''
  }
})

// 나쁜 예: 무제한 라벨 값
const badServer = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  normalizePath: (req) => {
    return req.url || '' // 모든 고유 URL을 개별 메트릭으로 생성
  }
})
```

### 2. 메모리 사용량 최적화

```typescript
const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  bypass: (req) => {
    // 정적 파일 요청 제외로 메모리 절약
    if (req.url?.includes('.')) return true
    
    // 빈번한 헬스체크 제외
    if (req.url === '/health') return true
    
    return false
  }
})
```

## 문제 해결

### 메트릭이 수집되지 않는 경우

1. **PM2 설정 확인**: PM2 환경이 아닌 경우 `pm2: false`로 설정
2. **엔드포인트 확인**: `/metrics` 경로로 접근 시 메트릭 출력 확인
3. **바이패스 로직 확인**: 모든 요청이 바이패스되고 있는지 확인

### 높은 메모리 사용량

1. **카디널리티 확인**: 라벨 조합의 수가 너무 많지 않은지 확인
2. **바이패스 적용**: 불필요한 요청들을 바이패스로 제외
3. **정규화 개선**: 경로 정규화로 고유 경로 수 제한

### PM2 클러스터에서 메트릭 중복

PM2 클러스터 환경에서는 자동으로 메트릭이 집계됩니다. 개별 프로세스별 메트릭이 필요한 경우 별도 설정이 필요합니다.

## 요구 사항

- Node.js 16.0.0 이상
- TypeScript 4.5 이상
- Next.js 12.0.0 이상

## 라이센스

MIT License