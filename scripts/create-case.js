const fs = require("fs");
const path = require("path");

const caseName = process.argv[2];

if (!caseName) {
  console.error("사건명을 입력하세요.");
  console.error("예: node scripts/create-case.js 올스프링글로벌인베스트");
  process.exit(1);
}

const slug = caseName
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\w가-힣-]/g, "");

const casesDir = path.join(
  process.cwd(),
  "content",
  "daeonlawfintech",
  "cases"
);

const templatePath = path.join(casesDir, "_template.mdx");
const outputPath = path.join(casesDir, `${slug}.mdx`);

if (!fs.existsSync(templatePath)) {
  console.error("_template.mdx 파일이 없습니다.");
  console.error(templatePath);
  process.exit(1);
}

if (fs.existsSync(outputPath)) {
  console.error("이미 존재하는 파일입니다. 기존 파일을 삭제한 뒤 다시 실행하세요.");
  console.error(outputPath);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf-8");

const result = template.replaceAll("{{CASE_NAME}}", caseName);

fs.writeFileSync(outputPath, result, "utf-8");

console.log("생성 완료:");
console.log(outputPath);
console.log("");
console.log("접속 주소:");
console.log(`/cases/${slug}`);