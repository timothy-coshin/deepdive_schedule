# DIVEBOARD · 딥스테이션 × 파라다이브 통합 예약 캘린더

GitHub Pages에 올릴 수 있는 **반응형 정적 웹앱**입니다. 프리다이빙 풀 두 곳의 기본 이용 회차를 일/주/월 달력으로 비교하고, 연결된 **허용된 읽기 전용 JSON 피드**가 있으면 수집한 예약 가능 상태를 표시합니다.

> **중요: 예약 실시간 연동은 아직 불가.** 2026-11-03 기준 두 업체의 공개 예약 잔여석 API를 검증하지 못했습니다. 딥스테이션 예약 화면은 로그인 필요. 이 저장소는 달력, GitHub Pages 배포, 갱신 엔진, 데이터 검증까지 구현하지만, **실제 잔여석을 가져오려면 두 업체에서 접근이 허용된 데이터 피드/API가 필요합니다.** API 미연결일 때는 예약 가능/마감/잔여석을 지어내지 않고 모두 `확인 필요`로 표시합니다. **실시간 조회가 되는 척하는 서비스가 아닙니다.**

## 화면에서 제공하는 기능

- `일 / 주 / 월` 보기, 이전/다음, 오늘, 날짜 선택
- 전체 / 딥스테이션 / 파라다이브 필터
- 기본 운영 회차 1–5부 (`08:00–11:00`, `11:00–14:00`, `14:00–17:00`, `17:00–20:00`, `20:00–23:00`) 표시. **운영 시간은 예약 가능 상태를 의미하지 않으며 변동될 수 있습니다.**
- 검증된 피드로 들어온 슬롯은 예약 가능/잔여 적음/마감, 잔여 인원, 시설 구분 표시
- 오래된 피드(20분 이상)는 **가능 상태 숨김/확인 필요로 격하**
- 수동 JSON 불러오기, 사용자 소유의 API URL 연결, 샘플 모드
- 공식 예약 페이지 이동 및 모바일 대응
- 저장소에 비밀번호나 업체 쿠키 저장 없이 배포

## GitHub Pages 배포

### 방법 A. GitHub 웹사이트만 이용

1. GitHub에서 새 **public** 저장소 `diveboard` 생성 (`main` 브랜치).
2. 이 압축파일을 풀고, **최상위 파일과 폴더 전체**를 저장소에 업로드합니다. `.github/workflows/deploy.yml`이 업로드되었는지 확인하세요.
3. 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions** 선택.
4. **Actions → Build and deploy DIVEBOARD → Run workflow**를 실행하거나 `main`에 커밋합니다.
5. 성공하면 Pages에 `https://<GITHUB_USERNAME>.github.io/diveboard/` 주소가 생성됩니다. 실제 URL은 Pages 화면 또는 Actions 배포 결과에서 확인하세요.

### 방법 B. 터미널에서 (GitHub CLI 로그인 상태)

```bash
cd diveboard-github
git init
git add .
git commit -m "Initial DIVEBOARD release"
git branch -M main
gh repo create diveboard --public --source=. --remote=origin --push
```

이후 GitHub의 `Settings → Pages → Source: GitHub Actions`에서 소스를 선택한 후 Actions 워크플로를 실행하세요.

### 로컬 실행

```bash
# Python 3만 있으면 UI를 실행할 수 있음
python3 -m http.server 8080
# http://localhost:8080

# 데이터 수집/테스트/정적 빌드는 Node.js 20+ 사용
npm test
npm run refresh
npm run build
```

## 예약 데이터 연결 (실제 잔여석의 필수 조건)

양 시설 **공식 허가를 받은** 읽기 전용 JSON API 또는 별도로 운영 중인 합법적인 어댑터가 필요합니다. 웹사이트 화면을 무단 우회하거나 로그인 쿠키를 공유하지 마세요. 다음 Repository secrets 설정(값은 공개되지 않음)을 사용할 수 있습니다.

| Secret 이름 | 용도 |
|---|---|
| `DEEPSTATION_FEED_URL` | 딥스테이션 예약 현황 JSON URL |
| `DEEPSTATION_FEED_TOKEN` | 선택적 Bearer 토큰 |
| `PARADIVE_FEED_URL` | 파라다이브 예약 현황 JSON URL |
| `PARADIVE_FEED_TOKEN` | 선택적 Bearer 토큰 |

Secrets 추가: **Settings → Secrets and variables → Actions → New repository secret**. 각 제공자당 개별 피드를 넣습니다. URL은 HTTPS여야 하고 서버가 `start=YYYY-MM-DD&end=YYYY-MM-DD`를 처리해야 합니다. 이 API는 공식 사이트 주소를 단순히 붙여 넣는 것이 아닙니다.

예시 (`GET /availability?start=2026-11-03&end=2026-11-10`):

```json
{
  "updatedAt": "2026-11-03T12:01:00+09:00",
  "slots": [
    {
      "date": "2026-11-03",
      "start": "11:00",
      "end": "14:00",
      "name": "2부",
      "category": "프리다이빙 입장",
      "status": "available",
      "remaining": 3,
      "total": 20
    }
  ]
}
```

`facility`은 서버가 각 Secret에 연결한 제공자 값으로 강제하며 외부 입력을 믿지 않습니다. `status`: `available`, `limited`, `full`, `unknown`. 총 정원·잔여석은 선택 사항이며, 정확히 확인된 정보만 넣어야 합니다. 다른 예약 종목(딥탱크 부이 등)은 `category`로 표시합니다. 검증 실패나 접근 실패 시 **확인 필요**로 처리하고 이전 결과를 신뢰하지 않습니다.

한 번 연결되면 `.github/workflows/deploy.yml`이 **5분마다** 수집과 배포를 시도하며, 웹페이지는 1분마다 배포된 데이터 파일을 새로 확인합니다. GitHub Actions의 예약 실행은 5분이 최소 설정 간격이지만 지연되거나 누락될 수 있고 배포에도 시간이 걸리므로 **정확히 5분마다 최신 데이터를 보장하지는 않습니다**. 본 프로젝트는 조회/비교만 제공하며 실제 예약·결제는 공식 홈페이지에서 합니다.

## 구조

```text
diveboard-github/
├── index.html                 # 전체 UI, 외부 프런트엔드 의존성 없음
├── data/availability.json     # 최신 확인된 상태/연동 상태. 기본값은 0개
├── src/feed.mjs               # 서버 측 입력 검증 (fail-closed)
├── scripts/refresh.mjs        # 허용된 JSON 피드 수집
├── scripts/build.mjs          # GitHub Pages용 dist/ 생성
├── tests/feed.test.mjs        # 날짜/상태/오래된 데이터 단위 테스트
├── .github/workflows/deploy.yml
└── package.json
```

### 공식 링크와 운영 회차 근거

- 딥스테이션 이용규정 및 회차: https://deepstation.kr/theme/basic/sub/info2.php
- 딥스테이션 예약: https://deepstation.kr/rez/step1.php (로그인 필요)
- 파라다이브35 안내 및 회차: https://www.paradive.co.kr/service/pc/page/paradive_01.php
- 파라다이브 예약: https://www.paradive.co.kr/service/pc/page/reservation01.php

*양 시설과 제휴 또는 공식 API 연동을 주장하지 않는 비공식 조회 화면입니다.*
