import type { ReactNode } from "react"


interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`relative z-10 w-full h-full p-0 sm:p-6 md:p-8 rounded-xl bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden container ${className}`}
    >
      {children}
    </div>
  )
}
