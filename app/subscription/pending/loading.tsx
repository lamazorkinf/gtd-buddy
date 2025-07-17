import { Loader2 } from "lucide-react"

/**
 * Loading state for /subscription/pending
 *
 * Next.js exige un Suspense boundary cuando se usa `useSearchParams`
 * dentro de un Client Component. Este archivo cumple esa función
 * mostrando un loader sencillo y centrado.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-gtd-action-300 selection:text-white">
      <Loader2 className="h-10 w-10 animate-spin text-gtd-neutral-500" />
    </div>
  )
}
