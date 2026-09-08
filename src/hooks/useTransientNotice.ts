import { useEffect, useState } from 'react'

export function useTransientNotice(duration = 2400) {
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), duration)
    return () => window.clearTimeout(timer)
  }, [duration, notice])

  return { notice, setNotice }
}
