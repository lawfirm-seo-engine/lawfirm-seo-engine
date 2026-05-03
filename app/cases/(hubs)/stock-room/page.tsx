import CategoryHubPage, {
  generateCategoryHubMetadata,
} from "@/app/cases/CategoryHubPage"

export async function generateMetadata() {
  return generateCategoryHubMetadata("stock-room")
}

export default function Page() {
  return <CategoryHubPage categoryId="stock-room" />
}
