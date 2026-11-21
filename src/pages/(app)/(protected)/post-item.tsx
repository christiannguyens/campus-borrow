/**
 * Post item — a form to list something you're willing to lend.
 * Served at /post-item. Saves straight to the `items` collection; the schema's
 * permissions allow any signed-in student to create items.
 */

import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutations } from 'deepspace'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useToast,
} from '@/components/ui'
import { Page } from '@/components/borrowing/PageStates'
import type { NewItem } from '@/lib/borrowing'
import { ITEM_CATEGORIES } from '@/schemas/items-schema'

type Errors = Partial<Record<keyof NewItem, string>>

/** Returns a message for each required field that's empty. */
function validate(form: NewItem): Errors {
  const errors: Errors = {}
  if (!form.name.trim()) errors.name = 'Please enter a name.'
  if (!form.category) errors.category = 'Please choose a category.'
  if (!form.pickupLocation.trim()) errors.pickupLocation = 'Please say where to pick it up.'
  return errors
}

const EMPTY_FORM: NewItem = { name: '', description: '', category: '', pickupLocation: '' }

export default function PostItemPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { ready, createConfirmed } = useMutations<NewItem>('items')

  const [form, setForm] = useState<NewItem>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  function update(field: keyof NewItem, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined })) // clear that field's error as they type
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      // "Confirmed" waits until the server has saved it, so we only move on if it worked.
      await createConfirmed({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        pickupLocation: form.pickupLocation.trim(),
      })
      toast.success('Item posted', 'Other students can now see it on Browse.')
      navigate('/my-items')
    } catch (err) {
      toast.error("Couldn't post your item", err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page title="Post an item" subtitle="List something you're happy to lend to other students.">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6"
      >
        <Field id="name" label="Name" error={errors.name}>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. TI-84 calculator"
            aria-invalid={!!errors.name}
          />
        </Field>

        <Field id="description" label="Description (optional)">
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Condition, what's included, any rules"
            rows={3}
          />
        </Field>

        <Field id="category" label="Category" error={errors.category}>
          <Select value={form.category} onValueChange={(v) => update('category', v)}>
            <SelectTrigger id="category" aria-label="Category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="pickupLocation" label="Pickup location" error={errors.pickupLocation}>
          <Input
            id="pickupLocation"
            value={form.pickupLocation}
            onChange={(e) => update('pickupLocation', e.target.value)}
            placeholder="e.g. Main library front desk"
            aria-invalid={!!errors.pickupLocation}
          />
        </Field>

        <Button type="submit" className="w-full sm:w-auto" disabled={!ready} loading={saving}>
          Post item
        </Button>
      </form>
    </Page>
  )
}

/** One labeled form row with an optional red error message underneath. */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
