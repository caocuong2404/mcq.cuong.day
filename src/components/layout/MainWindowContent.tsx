import { cn } from '@/lib/utils'
import { McqContainer } from '@/components/mcq/McqContainer'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children || <McqContainer />}
    </div>
  )
}

export default MainWindowContent
