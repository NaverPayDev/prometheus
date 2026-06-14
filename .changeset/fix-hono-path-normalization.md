---
'@naverpay/prometheus-hono': minor
---

fix(hono): 경로 정규화가 동작하지 않아 동적 경로가 메트릭 라벨에 그대로 쌓이던 문제 수정

- `getHonoMetricsMiddleware`: Next.js 라우트 그룹핑에 `url.href`(scheme/host 포함)가 아니라 `url.pathname`을 넘기도록 수정. 기존에는 `/http://host/...` 형태의 비정규화 라벨이 생성되었습니다.
- `getHonoMetricsMiddleware`: 사용자가 제공한 `normalizePath`가 우선 적용되도록 수정. 기존 `||` 체이닝에서는 Next.js 그룹핑이 미매칭 시에도 비어있지 않은 값을 반환해 `normalizePath`가 무시되었습니다. 이제 `normalizePath`가 값을 반환하면 그 값을 사용하고, `undefined`를 반환하면 Next.js 그룹핑 → 기본 정규화로 위임합니다(하이브리드 앱에서 "API 경로만 직접 정규화, 나머지는 Next.js에 위임" 가능).
- `normalizePath` 반환 타입을 `string | undefined`로 확장.
- `createNormalizedHonoRouterPath`: `prefix`가 두 번 부착되던 버그 수정(`/prefix/prefix/...`). 이제 `prefix` 인자가 정상 동작합니다.
