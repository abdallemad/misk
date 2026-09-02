"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  Trash2Icon,
  UndoIcon,
  XIcon,
} from "lucide-react"

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
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from "@/constants/uploads"
import { cn } from "@/lib/utils"
import type { ProductImageRow } from "@/services/product.service"

type ProductGalleryFieldProps = {
  /** Photos already on the row, in their stored order. */
  images: ProductImageRow[]
  /**
   * Called whenever the gallery changes.
   *
   * The form uses it to drop any standing error on `images`. Every other
   * field in this form clears its own error when its control fires a change
   * event — but most of this one's edits are React state (a tile removed, a
   * pick undone) and never touch the file input, so "you have too many
   * images" would otherwise survive the admin removing one, and Base UI would
   * go on refusing to submit a form that is now perfectly valid.
   */
  onChanged?: () => void
  disabled?: boolean
}

type PickedFile = {
  key: string
  file: File
  /** `blob:` preview, revoked when the file is dropped or on unmount. */
  preview: string
}

/**
 * The product gallery: what is already stored, what order it is in, and what
 * is being added.
 *
 * Three things are submitted, and they are deliberately not three
 * independent lists:
 *
 *   - `keepImage` — one hidden input per surviving photo, **in display
 *     order**. The service reads position from the index, so reordering and
 *     removing are the same edit. A separate `removeImage` list could
 *     contradict the order list; this cannot.
 *   - `images` — the file input itself, appended after the survivors.
 *   - nothing at all for a removed photo. Its absence *is* the removal.
 *
 * The first image is the cover — it is what the catalogue grid and the cart
 * line show — so it is labelled rather than left for the admin to infer from
 * position.
 *
 * See docs/products-feature.md.
 */
export function ProductGalleryField({
  images,
  onChanged,
  disabled,
}: ProductGalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [kept, setKept] = useState<ProductImageRow[]>(images)
  const [removed, setRemoved] = useState<ProductImageRow[]>([])
  const [picked, setPicked] = useState<PickedFile[]>([])
  const [counter, setCounter] = useState(0)
  /** Why some of what the admin just picked did not make it into the strip. */
  const [notice, setNotice] = useState<string | null>(null)

  /**
   * Revoke every outstanding preview on unmount, and only on unmount.
   *
   * The list has to arrive through a ref rather than a dependency. An effect
   * keyed on `picked` runs its *previous* cleanup whenever the list changes,
   * which would revoke the first file's `blob:` URL the moment a second file
   * was added — the tile would go blank while the file was still selected.
   * Individual removals revoke their own URL in `dropPicked`, so nothing
   * leaks in the meantime.
   */
  const pickedRef = useRef<PickedFile[]>([])

  useEffect(() => {
    pickedRef.current = picked
  }, [picked])

  useEffect(() => {
    return () => {
      for (const item of pickedRef.current) URL.revokeObjectURL(item.preview)
    }
  }, [])

  const total = kept.length + picked.length
  const remaining = MAX_GALLERY_IMAGES - total

  /**
   * Push the current list back into the `<input type="file">`.
   *
   * A `FileList` is read-only and cannot be constructed, so `DataTransfer` is
   * the only way to drop one file out of a multi-file pick. Without this,
   * "remove" could only ever clear the whole selection — the browser would
   * still submit the file the admin just took out of the strip.
   */
  function syncInput(files: PickedFile[]) {
    if (!inputRef.current) return

    const transfer = new DataTransfer()
    for (const item of files) transfer.items.add(item.file)
    inputRef.current.files = transfer.files
  }

  /**
   * Take what fits, say what did not, and never leave a file in the input
   * that the server is going to refuse.
   *
   * Size is checked **here** as well as in the Zod schema, which is unusual
   * for this codebase — the schema is normally the only gate. The reason is
   * that an oversized file does not reach the schema at all: the whole
   * `multipart` body has to fit inside `serverActions.bodySizeLimit`, and a
   * body over that is rejected by the framework before the action runs, so
   * there is no field error to render because no code ran to produce one.
   * Dropping the file at pick time is the only place the admin can be told
   * which file was the problem.
   */
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChanged?.()

    const incoming = Array.from(event.target.files ?? [])

    const oversized = incoming.filter((file) => file.size > MAX_IMAGE_BYTES)
    const withinSize = incoming.filter((file) => file.size <= MAX_IMAGE_BYTES)
    const overCap = Math.max(0, withinSize.length - Math.max(0, remaining))

    const reasons = [
      oversized.length > 0
        ? `${oversized.map((file) => file.name).join("، ")} — أكبر من ${MAX_IMAGE_MB} ميجابايت`
        : null,
      overCap > 0 ? `${overCap} صورة تتجاوز الحد الأقصى` : null,
    ].filter(Boolean)

    setNotice(reasons.length > 0 ? `لم تُضف: ${reasons.join(" · ")}.` : null)

    // The browser replaces the whole selection on every pick, so a second
    // trip to the file dialog would otherwise discard the first. Appending
    // and writing the result back is what makes picking twice additive.
    const accepted = withinSize
      .slice(0, Math.max(0, remaining))
      .map((file, index) => ({
        key: `picked-${counter + index}`,
        file,
        preview: URL.createObjectURL(file),
      }))

    const next = [...picked, ...accepted]

    setCounter((value) => value + incoming.length)
    setPicked(next)
    // Always, even when nothing was accepted: the input still holds the
    // rejected files otherwise, and they would be submitted anyway.
    syncInput(next)
  }

  function dropPicked(key: string) {
    setNotice(null)
    onChanged?.()

    const target = picked.find((item) => item.key === key)
    if (target) URL.revokeObjectURL(target.preview)

    const next = picked.filter((item) => item.key !== key)
    setPicked(next)
    syncInput(next)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= kept.length) return

    const next = [...kept]
    ;[next[index], next[target]] = [next[target], next[index]]
    setKept(next)
  }

  function remove(image: ProductImageRow) {
    onChanged?.()
    setKept((current) => current.filter((item) => item.id !== image.id))
    setRemoved((current) => [...current, image])
  }

  function restore(image: ProductImageRow) {
    onChanged?.()
    setRemoved((current) => current.filter((item) => item.id !== image.id))
    setKept((current) => [...current, image])
  }

  return (
    <Field name="images">
      <FieldLabel htmlFor="product-images">الصور</FieldLabel>

      {total === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <ImageIcon className="size-5 shrink-0" aria-hidden="true" />
          <span>لا توجد صور بعد. أول صورة تُضاف هي صورة الغلاف.</span>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {kept.map((image, index) => (
            <li key={image.id}>
              <GalleryTile
                src={image.url}
                cover={index === 0}
                disabled={disabled}
                onRemove={() => remove(image)}
                onMoveStart={index > 0 ? () => move(index, -1) : undefined}
                onMoveEnd={
                  index < kept.length - 1 ? () => move(index, 1) : undefined
                }
              />
              {/* Order *is* position — the service numbers these by index. */}
              <input type="hidden" name="keepImage" value={image.id} />
            </li>
          ))}

          {picked.map((item, index) => (
            <li key={item.key}>
              <GalleryTile
                src={item.preview}
                blob
                cover={kept.length === 0 && index === 0}
                pending
                disabled={disabled}
                onRemove={() => dropPicked(item.key)}
              />
            </li>
          ))}
        </ul>
      )}

      {removed.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2">
          <span className="text-xs text-muted-foreground">
            ستُحذف عند الحفظ:
          </span>
          {removed.map((image) => (
            <Button
              key={image.id}
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => restore(image)}
              disabled={disabled}
            >
              <UndoIcon aria-hidden="true" />
              تراجع
            </Button>
          ))}
        </div>
      ) : null}

      <Input
        id="product-images"
        name="images"
        type="file"
        multiple
        accept={IMAGE_ACCEPT_ATTR}
        ref={inputRef}
        onChange={handleChange}
        disabled={disabled || remaining <= 0}
        className="h-auto py-1.5 file:me-2"
      />

      <FieldDescription>
        {IMAGE_FORMATS_LABEL} — {MAX_IMAGE_MB} ميجابايت للصورة، وحتى{" "}
        {MAX_GALLERY_IMAGES} صور. الأولى هي صورة الغلاف.
      </FieldDescription>

      {/* Two errors, from two places. The first is this component's own —
          a file it refused before the form was ever submitted — so it is
          passed as children and always renders. The second is whatever the
          schema or the server said about `images`, which the field finds by
          its own name. */}
      {notice ? <FieldError>{notice}</FieldError> : null}
      <FieldError />
    </Field>
  )
}

type GalleryTileProps = {
  src: string
  /** A `blob:` URL — there is nothing for the image optimizer to fetch. */
  blob?: boolean
  cover?: boolean
  /** Picked in the browser but not yet on the server. */
  pending?: boolean
  disabled?: boolean
  onRemove: () => void
  onMoveStart?: () => void
  onMoveEnd?: () => void
}

function GalleryTile({
  src,
  blob,
  cover,
  pending,
  disabled,
  onRemove,
  onMoveStart,
  onMoveEnd,
}: GalleryTileProps) {
  return (
    <div
      className={cn(
        "relative size-24 overflow-hidden rounded-lg border bg-muted",
        cover ? "border-gold" : "border-border"
      )}
    >
      {blob ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <Image src={src} alt="" fill sizes="96px" className="object-cover" />
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1 end-1 bg-background/80 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={disabled}
      >
        {pending ? <XIcon aria-hidden="true" /> : <Trash2Icon aria-hidden="true" />}
        <span className="sr-only">إزالة الصورة</span>
      </Button>

      {(onMoveStart || onMoveEnd) && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-background/80 p-0.5">
          {/* Chevrons point the way the tile travels on screen, so in this
              RTL console "earlier" is the right-pointing one. */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveStart}
            disabled={disabled || !onMoveStart}
          >
            <ChevronRightIcon aria-hidden="true" />
            <span className="sr-only">تقديم</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveEnd}
            disabled={disabled || !onMoveEnd}
          >
            <ChevronLeftIcon aria-hidden="true" />
            <span className="sr-only">تأخير</span>
          </Button>
        </div>
      )}

      {cover ? (
        <span className="absolute top-1 start-1 rounded bg-gold px-1 text-[0.625rem] font-medium text-gold-foreground">
          الغلاف
        </span>
      ) : null}
    </div>
  )
}
