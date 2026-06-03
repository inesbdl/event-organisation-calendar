import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-3 flex flex-col gap-2 text-[13px] font-semibold text-slate-600">
      {children}
    </label>
  )
}

export function Btn({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  const base =
    'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50'
  const variants = {
    primary:
      'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 hover:brightness-105',
    secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
    ghost: 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50',
    danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  }
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md ${className}`}
    >
      {children}
    </section>
  )
}

export function CardTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
      {icon}
      {children}
    </h2>
  )
}
