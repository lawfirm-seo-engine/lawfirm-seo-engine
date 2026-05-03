import CategoryHubPage, {
  generateCategoryHubMetadata,
} from "@/app/cases/CategoryHubPage"

export async function generateMetadata() {
  return generateCategoryHubMetadata("crypto-room")
}

export default function Page() {
  return <CategoryHubPage categoryId="crypto-room" />
}
