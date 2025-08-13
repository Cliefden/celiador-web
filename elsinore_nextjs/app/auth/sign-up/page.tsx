import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up Not Available</CardTitle>
            <CardDescription>This platform is exclusively for vetted users</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              New user registration is not available. This platform is exclusively for pre-approved users.
            </p>
            <p className="text-sm text-muted-foreground">
              If you believe you should have access, please contact your administrator.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Return to Welcome Page</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
