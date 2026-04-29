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

const keyword = withKeyword(
  withKeyword(cleanCaseName, "사기"),
  "사칭"
)

const url = `https://daeonlawfintech.com/cases/${slug}`

console.log(`
제목:

${keyword} 피해 사례 및 대응 방법 안내


본문:

최근 ${keyword} 피해 상담 문의가 지속적으로 증가하고 있습니다.

처음에는 정상적인 투자 정보 제공, 부업의 기회 안내, 전문가 리딩 제공 등으로 접근하지만  
이후 별도의 사이트 가입 또는 어플 설치를 유도한 뒤 입금을 요구하는 방식으로 진행되는 경우가 많습니다.

특히 ${keyword} 사건의 경우 다음과 같은 특징이 반복적으로 확인됩니다.

✔ 수익이 발생한 것처럼 보이는 화면 제공  
✔ 출금 진행 시 추가 입금 요구  
✔ 세금, 인증비, 보증금 등의 명목 사용  
✔ 회사명과 일치하지 않는 계좌로 입금 유도  
✔ 담당자 또는 관리자와의 단톡방 운영

이와 같은 구조가 확인된다면 단순 투자 실패가 아니라  
${keyword} 유형의 신종사기 가능성을 반드시 검토해야 합니다.

현재 유사한 방식의 피해 사례와 실제 대응 진행 절차는 아래 페이지에서 확인하실 수 있습니다.

${url}


또한 동일하거나 유사한 방식으로 접근받은 경우라면  
대화 내용, 입금 내역, 사이트 주소 등의 자료를 먼저 정리해 두시는 것이 중요합니다.

${keyword} 외 추가 피해 사례 및 대응 전략은 네이버 카페에서도 계속 업데이트됩니다.

https://cafe.naver.com/daeonlawfintech
`)