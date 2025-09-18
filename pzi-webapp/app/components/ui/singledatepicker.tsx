import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { JollyCalendar } from "@/components/ui/calendar"
import { CalendarDate } from "@internationalized/date"

// Utilities copied from daterangepicker to ensure identical UX/validation
function formatDate(date: CalendarDate | null): string {
  if (!date) return ""
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.year}/${pad(date.month)}/${pad(date.day)}`
}

function parseDate(str: string): CalendarDate | undefined {
  if (!str) return undefined
  try {
    const [year, month, day] = str.split("/").map(Number)
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      year < 1 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return undefined
    }
    return new CalendarDate(year, month, day)
  } catch {
    return undefined
  }
}

export default function SingleDatePicker({
  value: initialValue,
  onChange,
  label = "Datum",
}: {
  value?: string
  onChange?: (value: string) => void
  label?: string
}) {
  const [value, setValue] = useState(initialValue || "")
  const [showCalendar, setShowCalendar] = useState(false)
  const [error, setError] = useState<string>("")

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const inputClass =
    "h-8 w-[140px] rounded-md border border-input bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Close calendar if click is not on input nor inside calendar popover
      const calendarEl = containerRef.current?.querySelector('.border.mt-1') as HTMLElement | null
      const clickOnInput = inputRef.current?.contains(target)
      const clickOnCalendar = calendarEl?.contains(target)

      if (showCalendar && !clickOnInput && !clickOnCalendar) {
        // confirm/normalize or clear
        const parsed = parseDate(value)
        let newVal = value
        if (parsed) {
          newVal = formatDate(parsed)
          setError("")
        } else if (value !== "") {
          // invalid input -> show inline error and clear
          setError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
          newVal = ""
        }
        setValue(newVal)
        onChange?.(newVal)
        setShowCalendar(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showCalendar, value, onChange])

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.target.value
    const parsed = parseDate(val)
    if (parsed) {
      const formatted = formatDate(parsed)
      if (formatted !== value) {
        setValue(formatted)
        onChange?.(formatted)
      }
      setError("")
    } else if (val !== "") {
      setError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
      setValue("")
      onChange?.("")
    }
  }

  return (
    <Card className="p-0 border-none shadow-none bg-transparent">
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-col gap-1" ref={containerRef}>
          <label className="text-sm font-medium">{label}</label>
          <div className="flex flex-col gap-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="YYYY/MM/DD"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setShowCalendar(true)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const parsed = parseDate(value)
                  if (parsed) {
                    const formatted = formatDate(parsed)
                    setValue(formatted)
                    onChange?.(formatted)
                    setShowCalendar(false)
                    setError("")
                  } else if (value !== "") {
                    setError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
                    setValue("")
                    onChange?.("")
                    setShowCalendar(false)
                  }
                }
              }}
              className={inputClass}
            />
            {error && (
              <span className="text-xs text-red-600 mt-1">{error}</span>
            )}
            {showCalendar && (
              <div className="border mt-1 rounded-md bg-white shadow p-2 w-fit z-10">
                <JollyCalendar
                  value={parseDate(value) || undefined}
                  focusedValue={parseDate(value) || undefined}
                  onChange={(date) => {
                    if (date) {
                      const formatted = formatDate(date)
                      setValue(formatted)
                      onChange?.(formatted)
                      setShowCalendar(false)
                      setError("")
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
