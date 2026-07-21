# Seonji Kim · Academic CV

GitHub Pages에서 바로 호스팅할 수 있는 정적 CV 웹사이트입니다. 별도의 웹 프레임워크나 빌드 과정 없이 `index.html`이 `data/publications.json`을 읽어 논문 목록과 상세 페이지를 생성합니다.

## 1. GitHub Pages에 올리기

1. GitHub에서 새 repository를 만듭니다.
   - 개인 홈페이지: `<username>.github.io`
   - 프로젝트 홈페이지: 원하는 이름(예: `academic-cv`)
2. 이 폴더의 **내용 전체**를 repository 최상단에 올립니다.
3. GitHub의 `Settings → Pages`로 이동합니다.
4. `Build and deployment`를 `Deploy from a branch`로 설정합니다.
5. Branch는 `main`, 폴더는 `/(root)`를 선택하고 저장합니다.
6. 몇 분 뒤 표시되는 Pages 주소로 접속합니다.

모든 경로가 상대 경로이므로 개인 홈페이지와 프로젝트 홈페이지에서 모두 작동합니다.

## 2. 먼저 교체할 파일

- 프로필 사진: `assets/profile.jpg`를 추가합니다.
- CV: `assets/cv/Seonji_Kim_CV.pdf`를 최신 파일로 덮어씁니다.
- 기본 소개·경력·교육·Teaching: `index.html`에서 수정합니다.
- 현재 논문 정보: `data/publications.json`에서 직접 수정할 수 있습니다.

## 3. 새 논문을 PDF로 추가하기

가장 안전한 흐름은 **자동 추출 → 사람이 한 번 확인 → 공개**입니다.

1. `papers/inbox/_template` 폴더를 복제합니다.
2. 복제한 폴더를 논문 slug로 변경합니다. 예: `elastic-scene-graph`
3. 논문 PDF를 그 폴더에 넣고 이름을 `paper.pdf`로 변경합니다.
4. 같은 폴더의 `paper.yml`을 작성합니다.
5. 폴더 전체를 commit하고 GitHub에 push합니다.
6. `Update publications from PDFs` Action이 자동 실행됩니다.
7. Action은 다음 파일을 생성하고 repository에 commit합니다.
   - `assets/papers/<slug>/main-figure.*`
   - `assets/papers/<slug>/citation.bib`
   - 갱신된 `data/publications.json`
8. Pages가 변경된 사이트를 자동으로 다시 공개합니다.

### 최소 입력

PDF만 넣어도 실행됩니다. 스크립트가 PDF metadata, 첫 페이지 텍스트, Abstract 구간, DOI, 큰 이미지 후보를 탐색합니다.

### 권장 입력

정확한 홈페이지를 위해 `paper.yml`에서 다음 항목은 확인하는 것이 좋습니다.

```yaml
id: elastic-scene-graph
title: "Full Paper Title"
authors:
  - Seonji Kim
  - Coauthor Name
year: 2026
venue: "IEEE TVCG, 2026"
abstract: "Official abstract copied from the paper"
doi: "10.xxxx/xxxxx"
main_figure: "figure1.png"
figure_caption: "Overview of the proposed method."
visual_type: graph
bibtex: |
  @article{kim2026example,
    title={Full Paper Title},
    author={Kim, Seonji and Name, Coauthor},
    year={2026}
  }
```

`paper.yml`에 작성된 값이 PDF 자동 추출 값보다 항상 우선합니다. Scholar BibTeX를 그대로 쓰려면 Scholar에서 복사한 내용을 `bibtex: |` 아래에 붙여 넣으면 됩니다.

## 4. GitHub Action 권한

자동 생성 결과를 다시 commit하려면 repository에서 다음을 확인합니다.

`Settings → Actions → General → Workflow permissions → Read and write permissions`

Branch protection으로 bot push가 막힌 repository에서는 workflow의 자동 commit 대신 Pull Request 방식으로 변경해야 합니다.

## 5. 로컬에서 확인하기

`index.html`을 더블클릭하면 브라우저의 보안 정책 때문에 JSON을 읽지 못할 수 있습니다. repository 폴더에서 다음 명령을 실행합니다.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

PDF 변환도 로컬에서 시험할 수 있습니다.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/ingest_papers.py
```

## 6. 자동 추출의 한계

- 학회·출판사마다 PDF 레이아웃이 달라 제목, 저자, Abstract를 항상 완벽하게 추출할 수는 없습니다.
- 대표 그림은 첫 6페이지의 큰 이미지 중 하나를 후보로 선택하므로 반드시 확인해야 합니다.
- Google Scholar는 자동 접근을 차단하는 경우가 많아 Scholar scraping을 workflow에 사용하지 않습니다.
- 정확한 BibTeX가 필요하면 Scholar, DBLP 또는 출판사에서 받은 BibTeX를 `paper.yml`에 넣는 것이 안전합니다.

즉, PDF 추가는 자동화하되 **공개 전 `paper.yml`과 추출된 대표 그림을 한 번 확인하는 구조**입니다.
