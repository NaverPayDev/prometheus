# @naverpay/prometheus

Prometheus 메트릭 수집 및 내보내기를 위한 TypeScript 라이브러리 모음입니다. PM2 클러스터링 환경에서의 메트릭 수집을 지원하며, Koa 및 Next.js 프레임워크와의 통합을 제공합니다.

## 패키지 구조

이 모노레포는 다음과 같은 패키지들로 구성되어 있습니다:

### 📦 [@naverpay/prometheus-core](./packages/core)

핵심 Prometheus 유틸리티 및 PM2 통합 기능을 제공하는 기본 패키지입니다.

**주요 기능:**

- Prometheus 히스토그램 및 게이지 메트릭 등록
- PM2 프로세스 간 메트릭 수집 및 집계
- Next.js 라우트 정규화
- HTTP 상태 코드 그룹화
- 기본 Node.js 메트릭 수집

### 📦 [@naverpay/prometheus-koa](./packages/koa)

Koa.js 프레임워크용 Prometheus 미들웨어 및 라우터를 제공합니다.

**주요 기능:**

- HTTP 요청 메트릭 수집 미들웨어
- 메트릭 엔드포인트 라우터
- API 트레이싱 미들웨어
- 요청 경로 정규화 지원

### 📦 [@naverpay/prometheus-next](./packages/next)

Next.js 애플리케이션용 통합 서버 솔루션을 제공합니다.

**주요 기능:**

- 메트릭 수집이 통합된 Next.js 서버
- 자동 라우트 패턴 매칭
- PM2 클러스터 환경 지원

## 설치

각 패키지를 개별적으로 설치할 수 있습니다:

```bash
# 코어 패키지
npm install @naverpay/prometheus-core

# Koa 사용 시
npm install @naverpay/prometheus-koa

# Next.js 사용 시
npm install @naverpay/prometheus-next
```

## 빠른 시작

### Koa 애플리케이션

```typescript
import Koa from 'koa'
import { createKoaPrometheusExporter } from '@naverpay/prometheus-koa'

const app = new Koa()

const { middleware, router } = await createKoaPrometheusExporter({
  pm2: true, // PM2 환경에서 실행 시
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
})

app.use(middleware)
app.use(router.routes())

app.listen(3000)
```

### Next.js 애플리케이션

```typescript
import { createNextServerWithMetrics } from '@naverpay/prometheus-next'

const server = await createNextServerWithMetrics({
  pm2: true,
  nextOptions: { dev: false },
  metricsPath: '/metrics',
})

server.listen(3000)
```

## 메트릭 수집

각 패키지는 다음과 같은 메트릭을 수집합니다:

### HTTP 요청 메트릭

- **메트릭명**: `http_request_duration_seconds`
- **타입**: Histogram
- **라벨**: `status_code`, `method`, `path`

### API 요청 메트릭 (Koa API 트레이싱)

- **메트릭명**: `http_api_request_duration_seconds`
- **타입**: Histogram
- **라벨**: `path`, `status`, `method`

### 서비스 상태 메트릭

- **메트릭명**: `up`
- **타입**: Gauge
- **설명**: 서비스 가용성 (1 = 실행 중, 0 = 중단)

### 기본 Node.js 메트릭

- CPU 사용률
- 메모리 사용량
- 이벤트 루프 지연
- HTTP 요청 지속시간
- 가비지 컬렉션 통계

## PM2 클러스터 지원

이 라이브러리는 PM2 클러스터 환경에서 여러 프로세스의 메트릭을 자동으로 집계합니다:

1. 각 워커 프로세스가 자체 메트릭을 수집
2. 메트릭 엔드포인트 요청 시 모든 프로세스의 메트릭을 수집
3. Prometheus 표준에 따라 메트릭을 집계하여 반환

## 고급 설정

### 요청 바이패스

특정 요청을 메트릭 수집에서 제외할 수 있습니다:

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  bypass: (context) => {
    // 헬스체크 요청 제외
    return context.path === '/health'
  }
})
```

### 경로 정규화

동적 라우트를 그룹화하여 메트릭을 수집할 수 있습니다:

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  normalizePath: (context) => {
    // /user/123 -> /user/:id
    return context.path.replace(/\/\d+/g, '/:id')
  }
})
```

### 상태 코드 포맷팅

상태 코드를 커스텀 형식으로 그룹화할 수 있습니다:

```typescript
const { middleware } = await createKoaPrometheusExporter({
  pm2: true,
  formatStatusCode: (context) => {
    if (context.status >= 400) return 'error'
    if (context.status >= 300) return 'redirect'
    return 'success'
  }
})
```

## 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 기여하기

버그 리포트, 기능 요청, 풀 리퀘스트를 환영합니다.

## 지원

문의사항이나 지원이 필요한 경우 이슈를 생성해 주세요.

## Package 추가하기

```bash

> pnpm turbo gen init

? What is the name of the package? (You can skip the `@naverpay/` prefix) random
? Enter a space separated list of dependencies you would like to install react
Scope: all 4 workspace projects
Packages: +1
+
Progress: resolved 679, reused 665, downloaded 0, added 0, done

╭ Warning ──────────────────────────────────────────────────────────────────────────╮
│                                                                                   │
│   Ignored build scripts: core-js-pure.                                            │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed to run   │
│   scripts.                                                                        │
│                                                                                   │
╰───────────────────────────────────────────────────────────────────────────────────╯

Done in 950ms using pnpm v10.13.1
>>> Changes made:
  • Config sanitized (function)
  • /packages/random/package.json (add)
  • /packages/random/tsconfig.json (add)
  • /packages/random/src/index.ts (add)
  • /packages/random/package.json (modify)
  • Package scaffolded (function)

```

---

## 스크립트

다양한 작업을 위한 사전 정의된 스크립트가 포함되어 있습니다:

| 스크립트                | 설명                                                                 |
|-------------------------|----------------------------------------------------------------------|
| `pnpm start`            | 모든 패키지에서 시작 스크립트를 실행.                                 |
| `pnpm build`            | Monorepo의 모든 패키지를 빌드.                                       |
| `pnpm test`             | 모든 패키지에서 테스트 실행.                                         |
| `pnpm lint`             | ESLint로 코드 린트.                                                 |
| `pnpm lint:fix`         | 린트 문제를 자동으로 수정.                                           |
| `pnpm prettier`         | Prettier로 포맷 확인.                                               |
| `pnpm prettier:fix`     | Prettier로 코드 포맷 자동 수정.                                      |
| `pnpm markdownlint`     | Markdown 파일 린트 실행.                                            |
| `pnpm markdownlint:fix` | Markdown 린트 문제 자동 수정.                                       |
| `pnpm clean`            | 작업 공간 초기화 및 의존성 재설치.                                   |
| `pnpm release:canary`   | Canary 릴리스 빌드 및 배포 (Git 태그 없음).                          |
| `pnpm release`          | 안정 릴리스 빌드 및 배포.                                           |

---

## 린트 및 포맷팅

**ESLint**와 **Prettier**가 린트와 코드 포맷팅을 위해 설정되어 있습니다. 커스텀 설정은 다음과 같습니다:

- **ESLint Config**: `@naverpay/eslint-config`
- **Prettier Config**: `@naverpay/prettier-config`

Git 커밋 전 `lint-staged`를 통해 자동으로 린트 및 포맷팅이 적용됩니다.

---

## Markdown 린트

Markdown 파일의 일관성을 유지하기 위해 `@naverpay/markdown-lint`를 사용합니다.

수동 실행:

```bash
pnpm markdownlint
pnpm markdownlint:fix
```

---

## Changeset 및 릴리스 관리

버전 관리 및 배포는 [Changesets](https://github.com/changesets/changesets)를 사용합니다.

---

## Contribution Guide

1. 레포지토리를 포크하고 새 브랜치를 생성합니다.
2. 모든 린트 및 테스트를 통과하도록 코드를 수정합니다.
3. 풀 리퀘스트를 제출합니다.

개선점이나 문제점이 있다면 레포지토리에 Issue를 열어주세요.

---

## 라이선스

이 템플릿은 네이버 파이낸셜 유저플랫폼 산하 공통개발TF (@NaverPayDev/frontend)에 의해 관리되며, 해당 라이선스 정책을 따릅니다.
