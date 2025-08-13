import { cookies } from 'next/headers';
export default async function Test() {
  const cookieStore = await cookies()
  return <pre>{JSON.stringify(cookieStore.getAll())}</pre>
}