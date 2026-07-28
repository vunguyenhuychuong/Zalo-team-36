import type { ReactNode } from 'react'
import type { Option } from '../data/options'
import { IconAlert, IconCheck, IconChevronDown } from './icons'

/* ---------------------------------------------------------
   Field wrapper: label UPPERCASE + dau * do, giong mau FPT.AI
   --------------------------------------------------------- */
interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  full?: boolean
  children: ReactNode
  htmlFor?: string
}

export function Field({ label, required, hint, error, full, children, htmlFor }: FieldProps) {
  return (
    <div className={'field' + (full ? ' grid__full' : '')}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required && <span className="field__req">*</span>}
      </label>
      {children}
      {hint && !error && <div className="field__hint">{hint}</div>}
      {error && (
        <div className="field__error">
          <IconAlert size={13} />
          {error}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------- */
interface TextInputProps {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'password'
  invalid?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  invalid,
  inputMode,
}: TextInputProps) {
  return (
    <input
      id={id}
      className={'control' + (invalid ? ' control--invalid' : '')}
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
    />
  )
}

/* --------------------------------------------------------- */
interface SelectInputProps {
  id: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder: string
  invalid?: boolean
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: SelectInputProps) {
  return (
    <div className="select-wrap">
      <select
        id={id}
        className={'control' + (invalid ? ' control--invalid' : '')}
        value={value}
        data-empty={value === '' ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="select-wrap__chev">
        <IconChevronDown size={17} />
      </span>
    </div>
  )
}

/* --------------------------------------------------------- */
interface TextAreaProps {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  invalid?: boolean
  rows?: number
}

export function TextArea({ id, value, onChange, placeholder, invalid, rows = 5 }: TextAreaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={'control' + (invalid ? ' control--invalid' : '')}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/* ---------------------------------------------------------
   Chip group: multi-select. Tap tren mobile de hon dropdown nhieu lua chon.
   --------------------------------------------------------- */
interface ChipGroupProps {
  options: Option[]
  selected: string[]
  onToggle: (value: string) => void
}

export function ChipGroup({ options, selected, onToggle }: ChipGroupProps) {
  return (
    <div className="chips">
      {options.map((o) => {
        const on = selected.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            className="chip"
            aria-pressed={on}
            onClick={() => onToggle(o.value)}
          >
            {on && (
              <span className="chip__tick">
                <IconCheck size={9} />
              </span>
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------
   Steps indicator
   --------------------------------------------------------- */
export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const items = ['Thông tin doanh nghiệp', 'Gợi ý giải pháp', 'Lộ trình & liên hệ']
  return (
    <div className="steps">
      {items.map((label, i) => {
        const n = i + 1
        const cls =
          'steps__item' +
          (n === current ? ' steps__item--active' : '') +
          (n < current ? ' steps__item--done' : '')
        return (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {i > 0 && <span className="steps__sep" />}
            <span className={cls}>
              <span className="steps__num">{n < current ? <IconCheck size={9} /> : n}</span>
              {label}
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------
   Meter: thanh % dung o dashboard
   --------------------------------------------------------- */
export function Meter({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'hot' | 'warm' | 'cool'
}) {
  const color =
    tone === 'hot' ? 'var(--warn)' : tone === 'warm' ? 'var(--brand)' : 'var(--muted-2)'
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter__val">
        <b style={{ color }}>{value}</b>
        <i>%</i>
      </div>
      <div className="meter__bar">
        <div className="meter__fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}
