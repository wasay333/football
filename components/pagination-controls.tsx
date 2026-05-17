import Link from 'next/link'

import { Button } from '@/components/ui/button'

type PaginationControlsProps = {
  basePath: string
  currentPage: number
  totalPages: number
}

function buildPageHref(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`
}

export function PaginationControls({
  basePath,
  currentPage,
  totalPages,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage > 1}
          disabled={currentPage <= 1}
        >
          {currentPage > 1 ? (
            <Link href={buildPageHref(basePath, currentPage - 1)}>Previous</Link>
          ) : (
            <span>Previous</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage < totalPages}
          disabled={currentPage >= totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={buildPageHref(basePath, currentPage + 1)}>Next</Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  )
}
