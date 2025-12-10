import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: React.ReactNode
}

export default function Select({ label, className = '', children, ...props }: SelectProps) {
  const selectClasses = `w-full py-2.5 px-4 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none cursor-pointer hover:border-gray-400 ${className}`

  if (label) {
    return (
      <div>
        <label className="block ml-1.5 mb-1 text-gray-700 font-bold text-sm">
          {label}
        </label>
        <select className={selectClasses} {...props}>
          {children}
        </select>
      </div>
    )
  }

  return (
    <select className={selectClasses} {...props}>
      {children}
    </select>
  )
}
