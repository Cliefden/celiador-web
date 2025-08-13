import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
            <CardDescription>You don&apos;t have permission to access this page</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              You don&apos;t have the required role to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <Button asChild className="mt-4">
              <Link href="/protected">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 