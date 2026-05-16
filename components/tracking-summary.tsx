import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FedExTrackingSnapshot } from '@/lib/fedex-tracking'

function formatDateTime(value?: string) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type TrackingSummaryProps = {
  snapshot: FedExTrackingSnapshot
  title?: string
}

export function TrackingSummary({ snapshot, title = 'FedEx Tracking' }: TrackingSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Status</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="default">{snapshot.status}</Badge>
              {snapshot.statusCode && <span className="text-xs text-muted-foreground">{snapshot.statusCode}</span>}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracking Number</p>
            <p className="mt-2 font-mono text-sm">{snapshot.trackingNumber}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Service</p>
            <p className="mt-2">{snapshot.service || 'Not available'}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Known Location</p>
            <p className="mt-2">{snapshot.lastLocation || 'Not available'}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated Delivery</p>
            <p className="mt-2">{formatDateTime(snapshot.estimatedDeliveryDate)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated Window</p>
            <p className="mt-2">
              {snapshot.estimatedWindow?.begins || snapshot.estimatedWindow?.ends
                ? `${formatDateTime(snapshot.estimatedWindow?.begins)} - ${formatDateTime(snapshot.estimatedWindow?.ends)}`
                : 'Not available'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent Events</p>
          {snapshot.events.length === 0 ? (
            <p className="text-muted-foreground">FedEx did not return any detailed scan events yet.</p>
          ) : (
            <ol className="space-y-3">
              {snapshot.events.map((event, index) => (
                <li key={`${event.timestamp}-${event.type}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="mt-1 w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-2">
                    <p className="font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.location || 'Location unavailable'}
                      {event.delayStatus ? ` - ${event.delayStatus}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
