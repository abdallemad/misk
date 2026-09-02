"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ImageIcon, Trash2Icon, UndoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  IMAGE_ACCEPT_ATTR,
  IMAGE_FORMATS_LABEL,
  MAX_IMAGE_MB,
} from "@/constants/uploads"

type CategoryImageFieldProps = {
  /** The image already stored on the row, or `null` when there is none. */
  currentImageUrl: string | null
  error?: string
  disabled?: boolean
}

/**
 * The category picture: file picker, live preview, and a way to clear one.
 *
 * Three states have to be told apart, because the service treats each
 * differently and only two of them are visible in `FormData`:
 *
 *   1. **A new file was chosen** — the `image` input carries it. Replaces
 *      whatever was there.
 *   2. **"Remove" was pressed** — no file, but a hidden `removeImage` input
 *      appears, which is how the column gets set back to `null`.
 *   3. **Neither** — no file and no flag, which the service reads as "leave
 *      the current image alone". This is the common case on an edit where the
 *      admin only fixed a typo, and it is why the file input cannot simply be
 *      trusted to mean "the image is now empty".
 *
 * The preview for a freshly picked file is a `blob:` URL, revoked when it is
 * replaced or the component unmounts — without that, every re-pick leaks a
 * few hundred KB for the lifetime of the page.
 */
export function CategoryImageField({
  currentImageUrl,
  error,
  disabled,
}: CategoryImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)

  // Revoke on unmount. The replace-case is handled at the swap itself, in
  // `onChange` and `clearPickedFile`, because this effect only sees the
  // latest value.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (preview) URL.revokeObjectURL(preview)

    if (!file) {
      setPreview(null)
      return
    }

    setPreview(URL.createObjectURL(file))
    // Picking a file supersedes an earlier "remove" — the row ends up with
    // the new image either way, and leaving both set would be contradictory.
    setRemoved(false)
  }

  function clearPickedFile() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    // The input holds a `FileList` that cannot be constructed by hand, so
    // resetting the value is the only way to un-pick a file.
    if (inputRef.current) inputRef.current.value = ""
  }

  const showing = preview ?? (removed ? null : currentImageUrl)
  const hasStoredImage = currentImageUrl !== null

  return (
    <Field>
      <FieldLabel htmlFor="category-image">الصورة</FieldLabel>

      <div className="flex items-start gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {showing ? (
            preview ? (
              /* A `blob:` URL points at memory in this tab — there is nothing
                 for the image optimizer to fetch, so `next/image` cannot be
                 used here. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Image
                src={showing}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            )
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            id="category-image"
            name="image"
            type="file"
            accept={IMAGE_ACCEPT_ATTR}
            ref={inputRef}
            onChange={handleChange}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className="h-auto py-1.5 file:me-2"
          />

          <div className="flex flex-wrap items-center gap-2">
            {preview ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={clearPickedFile}
                disabled={disabled}
              >
                <UndoIcon aria-hidden="true" />
                تراجع عن الاختيار
              </Button>
            ) : hasStoredImage && !removed ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setRemoved(true)}
                disabled={disabled}
              >
                <Trash2Icon aria-hidden="true" />
                إزالة الصورة
              </Button>
            ) : hasStoredImage && removed ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setRemoved(false)}
                disabled={disabled}
              >
                <UndoIcon aria-hidden="true" />
                تراجع عن الإزالة
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Present only while the admin has actually asked for the image to go —
          the service reads this by presence, same as the active toggle. */}
      {removed && !preview ? (
        <input type="hidden" name="removeImage" value="on" />
      ) : null}

      <FieldDescription>
        {IMAGE_FORMATS_LABEL} — {MAX_IMAGE_MB} ميجابايت كحد أقصى. اختياري.
      </FieldDescription>

      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
