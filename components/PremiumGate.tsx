'use client'

import { usePremium } from '@/lib/premium-context'
import PremiumPaywall from '@/components/PremiumPaywall'

interface PremiumGateProps {
  children: React.ReactNode
  icon?: string
  title?: string
  description?: string
}

export default function PremiumGate({ children, icon, title, description }: PremiumGateProps) {
  const { isPremium, loading } = usePremium()

  if (loading) {
    return <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 h-32 animate-pulse" />
  }

  return isPremium ? <>{children}</> : <PremiumPaywall icon={icon} title={title} description={description} />
}
