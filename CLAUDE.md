# 단위변환기 (unit-converter)

> 공통 개발 가이드는 [루트 CLAUDE.md](../CLAUDE.md) 참조

## 앱 정보

| 항목 | 값 |
|------|-----|
| 앱 이름 | 단위변환기 |
| appName | unit-converter |
| 스킴 | `intoss://unit-converter/` |
| 테마 색상 | #5C6BC0 |
| 광고 ID | `ait.v2.live.2be710cefc03430e` (전면형) |

## 차별화 기능

1. **퀵 프리셋**: 자주 쓰는 변환 한 번에 적용 (1인치→cm, 1평→m² 등)
2. **결과 복사**: 변환 결과 클립보드 복사
3. **변환 기록**: 이전 변환 저장 및 재사용

## 단위 카테고리 (7종)

| 카테고리 | 단위 |
|----------|------|
| 길이 | mm, cm, m, km, 인치, 피트, 야드, 마일 |
| 무게 | mg, g, kg, 톤, 파운드, 온스, 근, 돈 |
| 온도 | 섭씨, 화씨, 켈빈 |
| 면적 | cm², m², km², 평, 에이커, 헥타르 |
| 부피 | mL, L, cc, 갤런, m³ |
| 속도 | m/s, km/h, mph, 노트 |
| 데이터 | B, KB, MB, GB, TB |

## 빌드

```bash
docker-compose run --rm build
# 결과: output/unit-converter.ait
```

## 출시 체크리스트

- [x] 차별화 기능 3개 구현
- [x] 광고 ID (운영용 live)
- [x] 광고 고지 UI (AD 배지 + 설명)
- [x] 핵심 기능에 광고 없음
- [ ] displayName 토스 콘솔 일치 확인
- [ ] icon URL 토스 콘솔 일치 확인
- [ ] GitHub 리포 생성
- [ ] 로고 생성 및 업로드
- [ ] apps-registry.md 기록
