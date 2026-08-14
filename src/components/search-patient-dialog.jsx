import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, CalendarPlus, AlertTriangle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// Mock list of already-registered patients used for the search lookup.
const REGISTERED_PATIENTS = ['Andi Saputra', 'Budi Santoso', 'Citra Wulandari', 'Dewi Lestari']

export default function SearchPatientDialog({ open, onOpenChange }) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState('')
  const [searched, setSearched] = React.useState(false)
  const [matchedPatient, setMatchedPatient] = React.useState(null)

  const resetState = () => {
    setQuery('')
    setSearched(false)
    setMatchedPatient(null)
  }

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) resetState()
    onOpenChange(nextOpen)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const found = REGISTERED_PATIENTS.find((name) =>
      name.toLowerCase().includes(trimmed.toLowerCase())
    )

    setMatchedPatient(found ?? null)
    setSearched(true)
  }

  const handleNavigate = (flow) => {
    onOpenChange(false)
    resetState()
    navigate('/registration', { state: { flow } })
  }

  const notFound = searched && !matchedPatient

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Patient search results</DialogTitle>
          <DialogDescription>
            You can register patients, validate registered patients and make appointments here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="search-patient-query">Patient name or ID</Label>
            <div className="flex gap-2">
              <Input
                id="search-patient-query"
                placeholder="Search by patient name or ID"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearched(false)
                  setMatchedPatient(null)
                }}
                className="border rounded-md px-3"
              />
              <Button type="submit">
                <Search />
                Search
              </Button>
            </div>
          </div>

          {searched && matchedPatient && (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>Patient found</AlertTitle>
              <AlertDescription>{matchedPatient} is already registered.</AlertDescription>
            </Alert>
          )}

          {notFound && (
            <>
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Patient not yet registered</AlertTitle>
                <AlertDescription>
                  Please register first, by clicking the button below.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => handleNavigate('new-registration')}
                >
                  <UserPlus />
                  New Registration
                </Button>
                <Button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-[#87c341] to-[#03a83d] text-white hover:opacity-90"
                  onClick={() => handleNavigate('make-appointment')}
                >
                  <CalendarPlus />
                  Registration and Make an Appointment
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
