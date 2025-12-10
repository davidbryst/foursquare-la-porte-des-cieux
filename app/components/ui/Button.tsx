import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 border-none rounded-lg py-2.5 px-4 font-medium cursor-pointer transition-all duration-200 text-base sm:text-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7c3aed]'

  const variantClasses = {
    primary: 'bg-[#4a2b87] text-white hover:bg-[#3a2070]',
    secondary: 'bg-white text-[#4a2b87] hover:bg-gray-50 border border-[#c7b8ea]',
    danger: 'bg-[#d32f2f] text-white hover:bg-[#b71c1c]',
    success: 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]'
  }

  const widthClass = fullWidth ? 'w-full' : ''
  // Ensure button type defaults to 'button' to avoid accidental form submits
  if (!props.type) props.type = 'button'

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
