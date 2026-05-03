import CategoryHubPage, {
  generateCategoryHubMetadata,
} from "@/app/cases/CategoryHubPage"

export async function generateMetadata() {
  return generateCategoryHubMetadata("broadcast-exchange")
}

export default function Page() {
  return <CategoryHubPage categoryId="broadcast-exchange" />
}
