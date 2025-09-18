import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDate } from "@internationalized/date"
import { JollyCalendar } from "@/components/ui/calendar"

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

const dateRangeOptions = [
  { label: "žádný", value: "none" },
  { label: "Minulý týden", value: "last-week" },
  { label: "Minulý měsíc", value: "last-month" },
  { label: "Minulý rok", value: "last-year" },
  { label: "1.čtvrtletí", value: "q1" },
  { label: "2.čtvrtletí", value: "q2" },
  { label: "3.čtvrtletí", value: "q3" },
  { label: "4.čtvrtletí", value: "q4" },
] as const

type DateRangeOption = (typeof dateRangeOptions)[number]["value"]

export default function DateRangePicker({
  from: initialFrom,
  to: initialTo,
  onChange,
}: {
  from?: string
  to?: string
  onChange?: (from: string, to: string) => void
}) {
  const [from, setFrom] = useState(initialFrom || "")
  const [to, setTo] = useState(initialTo || "")
  const [fromError, setFromError] = useState<string>("")
  const [toError, setToError] = useState<string>("")
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>("none")
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)
  const fromInputRef = useRef<HTMLInputElement>(null)
  const toInputRef = useRef<HTMLInputElement>(null)

  function calendarDateToDate(date: CalendarDate): Date {
    return new Date(date.year, date.month - 1, date.day)
  }

  const handleChange = (newFrom: string, newTo: string) => {
    const parsedFrom = parseDate(newFrom)
    const parsedTo = parseDate(newTo)

    if (
      parsedFrom &&
      parsedTo &&
      calendarDateToDate(parsedFrom) > calendarDateToDate(parsedTo)
    ) {
      newTo = newFrom
    }

    setFrom(newFrom)
    setTo(newTo)
    onChange?.(newFrom, newTo)
  }

  const today = new CalendarDate(
    "gregory",
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  )
  const inputClass =
    "h-8 w-[140px] rounded-md border border-input bg-white text-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  function getStartOfWeek(date: CalendarDate): CalendarDate {
    const jsDate = calendarDateToDate(date)
    const dayOfWeek = jsDate.getDay()
    return date.subtract({ days: dayOfWeek })
  }

  const handleOptionChange = (option: DateRangeOption) => {
    setSelectedOption(option)

    const getLastDayOfMonth = (date: CalendarDate) => {
      const nextMonth = date.add({ months: 1 })
      return nextMonth.subtract({ days: 1 })
    }

    const getEndOfWeek = (startOfWeek: CalendarDate) => {
      return startOfWeek.add({ days: 6 })
    }

    switch (option) {
      case "none":
        handleChange(formatDate(today), formatDate(today))
        break
      case "last-week": {
        const startOfWeekDate = getStartOfWeek(today).subtract({ weeks: 1 })
        const endOfWeekDate = getEndOfWeek(startOfWeekDate)
        handleChange(formatDate(startOfWeekDate), formatDate(endOfWeekDate))
        break
      }
      case "last-month": {
        const lastMonth = today.subtract({ months: 1 })
        const startOfLastMonth = new CalendarDate(lastMonth.year, lastMonth.month, 1)
        const endOfLastMonth = getLastDayOfMonth(startOfLastMonth)
        handleChange(formatDate(startOfLastMonth), formatDate(endOfLastMonth))
        break
      }
      case "last-year": {
        const lastYear = today.subtract({ years: 1 })
        const startOfLastYear = new CalendarDate(lastYear.year, 1, 1)
        const endOfLastYear = new CalendarDate(lastYear.year, 12, 31)
        handleChange(formatDate(startOfLastYear), formatDate(endOfLastYear))
        break
      }
      case "q1":
        handleChange(
          formatDate(new CalendarDate(today.year, 1, 1)),
          formatDate(new CalendarDate(today.year, 3, 31))
        )
        break
      case "q2":
        handleChange(
          formatDate(new CalendarDate(today.year, 4, 1)),
          formatDate(new CalendarDate(today.year, 6, 30))
        )
        break
      case "q3":
        handleChange(
          formatDate(new CalendarDate(today.year, 7, 1)),
          formatDate(new CalendarDate(today.year, 9, 30))
        )
        break
      case "q4":
        handleChange(
          formatDate(new CalendarDate(today.year, 10, 1)),
          formatDate(new CalendarDate(today.year, 12, 31))
        )
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Zavře FROM kalendář pokud klik není na input ani na kalendář
      if (showFromCalendar && fromInputRef.current && !fromInputRef.current.contains(target) && fromRef.current && !fromRef.current.querySelector('.border.mt-1')?.contains(target)) {
        const parsed = parseDate(from)
        let newFrom = from
        if (parsed) {
          newFrom = formatDate(parsed)
          setFromError("")
        } else if (from !== "") {
          // invalid input -> show inline error and clear
          setFromError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
          newFrom = ""
        }
        
        setFrom(newFrom)
        setTo(to)
        onChange?.(newFrom, to)
        setShowFromCalendar(false)
      }
      
      // Zavře TO kalendář pokud klik není na input ani na kalendář
      if (showToCalendar && toInputRef.current && !toInputRef.current.contains(target) && toRef.current && !toRef.current.querySelector('.border.mt-1')?.contains(target)) {
        const parsed = parseDate(to)
        let newTo = to
        if (parsed) {
          newTo = formatDate(parsed)
          setToError("")
        } else if (to !== "") {
          // invalid input -> show inline error and clear
          setToError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
          newTo = ""
        }
        
        setFrom(from)
        setTo(newTo)
        onChange?.(from, newTo)
        setShowToCalendar(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [from, to, onChange, showFromCalendar, showToCalendar])

  function handleBlurFrom(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.target.value
    const parsed = parseDate(val)
    if (parsed) {
      const formatted = formatDate(parsed)
      if (formatted !== from) {
        handleChange(formatted, to)
      }
      setFromError("")
    } else if (val !== "") {
      setFromError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
      handleChange("", to)
    }
  }

  function handleBlurTo(e: React.FocusEvent<HTMLInputElement>) {
    const val = e.target.value
    const parsed = parseDate(val)
    if (parsed) {
      const formatted = formatDate(parsed)
      if (formatted !== to) {
        handleChange(from, formatted)
      }
      setToError("")
    } else if (val !== "") {
      setToError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
      handleChange(from, "")
    }
  }

  return (
    <Card className="p-0 border-none shadow-none bg-transparent">
      <CardContent className="space-y-4 p-0">
        <div className="space-y-4">
          {/* FROM */}
          <div className="flex flex-col gap-1" ref={fromRef}>
            <label className={`text-sm font-medium ${fromError ? "text-red-600" : ""}`}>Datum od</label>
            <div className="flex flex-col gap-1">
              <input
                ref={fromInputRef}
                type="text"
                placeholder="YYYY/MM/DD"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                onFocus={() => setShowFromCalendar(true)}
                onBlur={handleBlurFrom}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const parsed = parseDate(from)
                    if (parsed) {
                      const formatted = formatDate(parsed)
                      handleChange(formatted, to)
                      setShowFromCalendar(false)
                      setFromError("")
                    } else if (from !== "") {
                      setFromError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
                      handleChange("", to)
                      setShowFromCalendar(false)
                    }
                  }
                }}
                className={inputClass}
              />
              {fromError && (
                <span className="text-xs text-red-600 mt-1">{fromError}</span>
              )}
              {showFromCalendar && (
                <div className="border mt-1 rounded-md bg-white shadow p-2 w-fit z-10">
                  <JollyCalendar
                    value={parseDate(from) || undefined}
                    focusedValue={parseDate(from) || undefined}
                    onChange={(date) => {
                      if (date) {
                        const formatted = formatDate(date)
                        handleChange(formatted, to)
                        setShowFromCalendar(false)
                        setFromError("")
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* TO */}
          <div className="flex flex-col gap-1" ref={toRef}>
            <label className={`text-sm font-medium ${toError ? "text-red-600" : ""}`}>Datum do</label>
            <div className="flex flex-col gap-1">
              <input
                ref={toInputRef}
                type="text"
                placeholder="YYYY/MM/DD"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onFocus={() => setShowToCalendar(true)}
                onBlur={handleBlurTo}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const parsed = parseDate(to)
                    if (parsed) {
                      const formatted = formatDate(parsed)
                      handleChange(from, formatted)
                      setShowToCalendar(false)
                      setToError("")
                    } else if (to !== "") {
                      setToError("Datum není ve správném formátu. Použijte YYYY/MM/DD.")
                      handleChange(from, "")
                      setShowToCalendar(false)
                    }
                  }
                }}
                className={inputClass}
              />
              {toError && (
                <span className="text-xs text-red-600 mt-1">{toError}</span>
              )}
              {showToCalendar && (
                <div className="border mt-1 rounded-md bg-white shadow p-2 w-fit z-10">
                  <JollyCalendar
                    value={parseDate(to) || undefined}
                    minValue={parseDate(from) || undefined}
                    focusedValue={parseDate(to) || undefined}
                    onChange={(date) => {
                      if (date) {
                        const formatted = formatDate(date)
                        handleChange(from, formatted)
                        setShowToCalendar(false)
                        setToError("")
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRESETS + RESET */}
        <div className="flex items-center gap-2 pt-2">
          <select
            className="rounded-md border border-input bg-white text-black px-3 py-2 text-sm"
            value={selectedOption}
            onChange={(e) => handleOptionChange(e.target.value as DateRangeOption)}
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => handleChange("", "")}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
