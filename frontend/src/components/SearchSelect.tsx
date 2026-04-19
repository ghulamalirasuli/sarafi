import { useId, useMemo } from 'react'
import Select from 'react-select'
import type { GroupBase, StylesConfig } from 'react-select'
import { useTheme } from '../context/ThemeContext'

export type SearchSelectOption = { value: string; label: string }

type Props = {
  options: SearchSelectOption[]
  value: string
  onChange: (next: string) => void
  placeholder?: string
  isClearable?: boolean
  isDisabled?: boolean
  className?: string
  /** Narrower control (e.g. pagination). */
  size?: 'default' | 'compact'
}

function buildStyles(dark: boolean, compact: boolean): StylesConfig<SearchSelectOption, false, GroupBase<SearchSelectOption>> {
  const bg = dark ? '#0f172a' : '#ffffff'
  const border = dark ? '#475569' : '#cbd5e1'
  const borderFocus = dark ? '#818cf8' : '#6366f1'
  const text = dark ? '#f1f5f9' : '#0f172a'
  const muted = dark ? '#94a3b8' : '#64748b'
  const menuBg = dark ? '#1e293b' : '#ffffff'
  const optionSelected = dark ? '#312e81' : '#e0e7ff'
  const optionFocused = dark ? '#334155' : '#f1f5f9'
  const minH = compact ? 32 : 38

  return {
    control: (base, state) => ({
      ...base,
      minHeight: minH,
      backgroundColor: bg,
      borderColor: state.isFocused ? borderFocus : border,
      boxShadow: state.isFocused ? `0 0 0 1px ${borderFocus}` : 'none',
      '&:hover': { borderColor: state.isFocused ? borderFocus : border },
    }),
    valueContainer: (base) => ({ ...base, padding: compact ? '0 6px' : '0 8px' }),
    singleValue: (base) => ({ ...base, color: text, fontSize: compact ? 13 : 14 }),
    input: (base) => ({ ...base, color: text }),
    placeholder: (base) => ({ ...base, color: muted, fontSize: compact ? 13 : 14 }),
    menu: (base) => ({
      ...base,
      backgroundColor: menuBg,
      border: `1px solid ${border}`,
      borderRadius: 8,
      boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.45)' : '0 10px 40px rgba(15,23,42,0.12)',
      zIndex: 9999,
    }),
    menuList: (base) => ({ ...base, padding: 4, maxHeight: 280 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      fontSize: 14,
      cursor: 'pointer',
      backgroundColor: state.isSelected ? optionSelected : state.isFocused ? optionFocused : 'transparent',
      color: text,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({
      ...base,
      color: muted,
      padding: compact ? 4 : 6,
      transition: 'color 0.15s',
      '&:hover': { color: text },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: muted,
      padding: compact ? 4 : 6,
      '&:hover': { color: text },
    }),
    loadingIndicator: (base) => ({ ...base, color: muted }),
    noOptionsMessage: (base) => ({ ...base, color: muted, fontSize: 13 }),
  }
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  isClearable = true,
  isDisabled = false,
  className,
  size = 'default',
}: Props) {
  const { dark } = useTheme()
  const reactSelectId = useId()
  const styles = useMemo(() => buildStyles(dark, size === 'compact'), [dark, size])

  const selected = useMemo(() => {
    if (value === '') return null
    return options.find((o) => o.value === value) ?? null
  }, [options, value])

  return (
    <Select<SearchSelectOption, false, GroupBase<SearchSelectOption>>
      instanceId={reactSelectId}
      inputId={`${reactSelectId}-input`}
      isSearchable
      isClearable={isClearable}
      isDisabled={isDisabled}
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? '')}
      placeholder={placeholder}
      styles={styles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      className={className}
      classNamePrefix="sarafi-select"
      noOptionsMessage={() => 'No matches'}
    />
  )
}
