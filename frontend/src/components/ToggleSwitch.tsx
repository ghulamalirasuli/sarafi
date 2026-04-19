type Props = {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  ariaLabel: string
}

export function ToggleSwitch({ checked, onChange, disabled, ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${
        checked ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out ${
          checked ? 'translate-x-[1.25rem]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
