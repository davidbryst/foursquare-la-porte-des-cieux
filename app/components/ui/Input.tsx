import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className = '', ...props }: InputProps) {
  const inputClasses = `w-full py-2.5 px-4 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none placeholder:text-gray-400 hover:border-gray-400 ${className}`

  if (label) {
    return (
      <div>
        <label className="block mb-1 ml-1.5 text-gray-700 font-bold text-sm text-[#4a2b87] ">
          {label}
        </label>
        <input className={inputClasses} {...props} />
      </div>
    )
  }

  return <input className={inputClasses} {...props} />
}
