import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { AuthButton } from "~/components/auth/auth-button"
import { useNavigation } from "~/contexts/navigation-context"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function SiteHeader() {
  const { backUrl, getRouteName } = useNavigation()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {backUrl && (
          <>
            <Link href={backUrl}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
          </>
        )}
        <h1 className="text-base font-medium">{getRouteName()}</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* AuthButton removed to avoid confusion with login page */}
        </div>
      </div>
    </header>
  )
}
