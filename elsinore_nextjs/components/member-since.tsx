"use client"

import { useEffect, useState } from "react"

export function MemberSince({ date }: { date?: string }) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    if (date) {
      setFormatted(new Date(date).toLocaleDateString())
    }
  }, [date])

  if (!date) return null
  if (!formatted) return null // or a spinner/placeholder

  return <>{formatted}</>
} 