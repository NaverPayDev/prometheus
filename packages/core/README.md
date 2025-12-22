# @naverpay/prometheus-core

Prometheus 메트릭 수집 및 PM2 클러스터 통합을 위한 핵심 유틸리티 라이브러리입니다.

## 설치

```bash
npm install @naverpay/prometheus-core
```

## 주요 기능

### 🎯 메트릭 관리

- **히스토그램 등록**: HTTP 요청 지속시간 등을 측정하는 히스토그램 메트릭 생성
- **트레이싱**: 요청 시작부터 종료까지의 시간 측정 및 라벨 관리
- **게이지 메트릭**: 서비스 상태 표시를 위한 업타임 게이지

### 🔄 PM2 클러스터 지원

- **프로세스 간 통신**: PM2 message bus를 통한 메트릭 수집
- **메트릭 집계**: 여러 워커 프로세스의 메트릭을 자동으로 집계
- **연결 관리**: PM2 연결 생성 및 해제

### 🛣️ Next.js 통합

- **라우트 정규화**: Next.js 라우트 매니페스트를 활용한 동적 라우트 그룹화
- **정적 파일 처리**: Next.js 정적 파일 요청 분류

### 🚦 유틸리티

- **경로 필터링**: 헬스체크, 메트릭 엔드포인트 등 불필요한 요청 제외
- **상태 코드 그룹화**: HTTP 상태 코드를 메트릭 수집에 적합한 형태로 변환

## API 참조

### 메트릭 관리

#### `registerHistogram(type, name, labelNames, buckets?)`

새로운 히스토그램 메트릭을 등록합니다.

```typescript
import { registerHistogram } from '@naverpay/prometheus-core'

registerHistogram(
  'http_request',
  'http_request_duration_seconds',
  ['method', 'status_code', 'path'],
  [0.1, 0.5, 1, 2, 5] // 선택적 buckets
)
```

#### `startTraceHistogram(type, labelValues)`

히스토그램 타이머를 시작합니다.

```typescript
import { startTraceHistogram, endTraceHistogram } from '@naverpay/prometheus-core'

const trace = startTraceHistogram('http_request', {
  method: 'GET',
  path: '/api/users'
})

// 요청 처리...

endTraceHistogram(trace, { status_code: '200' })
```

#### `registerGaugeUp(prefix?)`

서비스 상태를 나타내는 up 게이지를 등록합니다.

```typescript
import { registerGaugeUp } from '@naverpay/prometheus-core'

registerGaugeUp('myservice_') // myservice_up 메트릭 생성
```

### PM2 커넥터

#### `pm2Connector.connect()`

PM2 message bus에 연결합니다.

```typescript
import { pm2Connector } from '@naverpay/prometheus-core'

await pm2Connector.connect()
```

#### `pm2Connector.getMetrics()`

모든 PM2 프로세스의 메트릭을 수집하고 집계합니다.

```typescript
const { metrics, metricsRegistry } = await pm2Connector.getMetrics()
console.log(metrics) // Prometheus 형식의 메트릭 문자열
```

#### `pm2Connector.disconnect()`

PM2 연결을 해제하고 메트릭 레지스트리를 초기화합니다.

```typescript
await pm2Connector.disconnect()
```

### Standalone 메트릭

#### `getStandaloneMetrics()`

PM2 없이 단일 프로세스에서 메트릭을 수집합니다.

```typescript
import { getStandaloneMetrics } from '@naverpay/prometheus-core'

const { metrics, contentType } = await getStandaloneMetrics()
console.log(metrics) // Prometheus 형식의 메트릭 문자열
console.log(contentType) // 'text/plain; version=0.0.4; charset=utf-8'
```

### Next.js 유틸리티

#### `getNextRoutesManifest()`

Next.js 라우트 매니페스트 파일을 읽어 파싱합니다.

```typescript
import { getNextRoutesManifest } from '@naverpay/prometheus-core'

const { basePath, routes } = getNextRoutesManifest()
```

#### `createNextRoutesUrlGroup()`

Next.js URL을 라우트 패턴으로 정규화하는 함수를 생성합니다.

```typescript
import { createNextRoutesUrlGroup } from '@naverpay/prometheus-core'

const normalizeUrl = createNextRoutesUrlGroup()
console.log(normalizeUrl('/user/123')) // '/user/[id]'
console.log(normalizeUrl('/api/data.json')) // 'STATIC'
```

### 유틸리티 함수

#### `isBypassPath(path)`

경로가 메트릭 수집에서 제외되어야 하는지 확인합니다.

```typescript
import { isBypassPath } from '@naverpay/prometheus-core'

console.log(isBypassPath('/metrics')) // true
console.log(isBypassPath('/healthcheck')) // true
console.log(isBypassPath('//malformed')) // true
console.log(isBypassPath('/api/users')) // false
```

#### `getStatusCodeGroup(statusCode)`

HTTP 상태 코드를 메트릭 수집용으로 그룹화합니다.

```typescript
import { getStatusCodeGroup } from '@naverpay/prometheus-core'

console.log(getStatusCodeGroup(200)) // 200
console.log(getStatusCodeGroup(201)) // '2xx'
console.log(getStatusCodeGroup(404)) // '4xx'
console.log(getStatusCodeGroup(500)) // 500
```

#### `enableCollectDefaultMetrics()`

Node.js 기본 메트릭 수집을 활성화합니다.

```typescript
import { enableCollectDefaultMetrics } from '@naverpay/prometheus-core'

enableCollectDefaultMetrics()
// CPU, 메모리, 이벤트 루프 등의 기본 메트릭 수집 시작
```

## 상수

### `DEFAULT_METRICS_PATH`

기본 메트릭 엔드포인트 경로입니다.

```typescript
console.log(DEFAULT_METRICS_PATH) // '/metrics'
```

### `BUCKETS`

기본 히스토그램 버킷 설정입니다.

```typescript
console.log(BUCKETS) // [0.1, 0.3, 0.95, 1.2, 3, 5, 7, 9, 10, 20, 30, 40, 50, 60, 70]
```

### `DEFAULT_METRICS_TYPE`

기본 메트릭 타입 열거형입니다.

```typescript
console.log(DEFAULT_METRICS_TYPE.HTTP_REQUEST) // 'http_request'
console.log(DEFAULT_METRICS_TYPE.HTTP_API_REQUEST) // 'http_api_request'
```

## 사용 예시

### 기본 메트릭 수집 설정

```typescript
import {
  pm2Connector,
  enableCollectDefaultMetrics,
  registerHistogram,
  registerGaugeUp,
  DEFAULT_METRICS_TYPE,
  DEFAULT_METRICS_NAMES,
  DEFAULT_METRICS_LABELS,
  BUCKETS
} from '@naverpay/prometheus-core'

async function setupMetrics() {
  // PM2 연결
  await pm2Connector.connect()
  
  // 기본 Node.js 메트릭 활성화
  enableCollectDefaultMetrics()
  
  // HTTP 요청 히스토그램 등록
  registerHistogram(
    DEFAULT_METRICS_TYPE.HTTP_REQUEST,
    DEFAULT_METRICS_NAMES.http_request,
    DEFAULT_METRICS_LABELS.http_request,
    BUCKETS
  )
  
  // 업타임 게이지 등록
  registerGaugeUp()
}
```

### 요청 트레이싱

```typescript
import { 
  startTraceHistogram, 
  endTraceHistogram,
  DEFAULT_METRICS_TYPE,
  getStatusCodeGroup 
} from '@naverpay/prometheus-core'

async function handleRequest(req, res) {
  // 트레이싱 시작
  const trace = startTraceHistogram(DEFAULT_METRICS_TYPE.HTTP_REQUEST, {
    method: req.method,
    path: req.path
  })
  
  try {
    // 요청 처리
    await processRequest(req, res)
  } finally {
    // 트레이싱 종료
    endTraceHistogram(trace, {
      status_code: getStatusCodeGroup(res.statusCode)
    })
  }
}
```

## 타입 정의

### `CommonPrometheusExporterOptions`

```typescript
interface CommonPrometheusExporterOptions {
  /** 메트릭 수집 활성화 여부 (기본값: true) */
  enabled?: boolean
  /** PM2 클러스터링 지원 활성화 여부 (기본값: false) */
  pm2?: boolean
  /** Next.js 라우트 정규화 활성화 여부 */
  nextjs?: boolean
  /** 메트릭 엔드포인트 경로 */
  metricsPath?: string
  /** 기본 Node.js 메트릭 수집 여부 */
  collectDefaultMetrics?: boolean
}
```

### `PM2MessageHandler`

```typescript
type PM2MessageHandler<T = any, R = any> = (data: T) => Promise<R> | R
```

### `PM2GetMessageOptions`

```typescript
interface PM2GetMessageOptions {
  /** 프로세스 필터 함수 */
  filter?: (process: ProcessDescription) => boolean
  /** PM2로 관리되지 않는 경우 자신 포함 여부 */
  includeSelfIfUnmanaged?: boolean
  /** 메시지 수집 타임아웃 (밀리초) */
  timeout?: number
}
```

## 요구 사항

- Node.js 16.0.0 이상
- TypeScript 4.5 이상
- PM2 사용 시: PM2 5.0.0 이상

## 라이센스

MIT License
