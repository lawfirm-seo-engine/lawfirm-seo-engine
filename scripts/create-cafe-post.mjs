const caseName = process.argv[2]

if (!caseName) {
  console.log("사건명을 입력하세요")
  process.exit()
}

const cleanCaseName = caseName.trim().replace(/\s+/g, " ")

const slug = cleanCaseName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "")

const withKeyword = (text, keyword) => {
  return text.includes(keyword) ? text : `${text} ${keyword}`
}

const searchKeyword = withKeyword(withKeyword(cleanCaseName, "사기"), "사칭")

const url = `https://daeonlawfintech.com/cases/${slug}`

console.log(`
제목:

${searchKeyword} 피해 사례 및 대응 방법 안내


본문:

최근 ${searchKeyword} 피해 상담이 증가하고 있습니다.

${searchKeyword} 피해 사례와 대응 방법을 아래 페이지에서 확인하실 수 있습니다.

${url}


추가 피해 사례 및 대응 전략은 네이버 카페에서도 계속 업데이트됩니다.

https://cafe.naver.com/daeonlawfintech
`)