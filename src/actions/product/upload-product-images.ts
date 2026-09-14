"use server"

import { IMAGE_FORMATS_LABEL } from "@/constants/uploads"
import { saveImage, UnsupportedImageError } from "@/lib/uploads"
import { galleryImage } from "@/schemas/product.schema"
import { isAdmin } from "@/services/auth.service"

/**
 * Upload picked gallery photos to Cloudinary immediately, ahead of the main
 * product save — the gallery's "ارفع الصور" button.
 *
 * Called directly from `product-gallery-field.tsx`'s click handler, the same
 * way `deleteProductAction` is: it returns a plain result the caller awaits,
 * not `useActionState` shape, because there is no form here to hold pending
 * state — the button owns its own.
 *
 * **Why this exists as a separate action from `saveProductAction`.** Before
 * this, every picked photo only ever reached Cloudinary as a side effect of
 * saving the *whole* product — one Server Action doing the DB write and every
 * image upload in the same request, which is why a gallery-heavy save took
 * several seconds with nothing to watch but a spinner (see
 * docs/products-feature.md, "Feedback while a save is in flight"). This
 * action does only the upload: the admin sees each photo land — or fails on
 * one particular file — well before they commit to the rest of the form.
 *
 * **Keyed, not indexed**, same reasoning as variant and ingredient rows: a
 * repeated `imageKey` input names which picked tile a `File` belongs to, so
 * the result of a partial failure (3 of 5 uploaded) can be routed back to the
 * exact tiles that need to stay picked rather than assumed to line up by
 * array position.
 *
 * **Validated by the same schema `saveProductAction` uses** —
 * `schemas/product.schema.ts`'s `galleryImage` — so a file this button
 * accepts is a file the final save would have accepted too, and the two
 * paths can never disagree about what a valid photo is.
 *
 * An uploaded-but-never-saved photo is an accepted, honest trade-off: closing
 * the tab after uploading and before pressing the real save button leaves an
 * orphaned Cloudinary asset, the same way abandoning any draft does. Nothing
 * here can reach into `ProductImage` early — no product may exist yet on
 * *create* — so there is no row to point at it and nothing to clean up.
 */
export type UploadedImageResult =
  | { key: string; ok: true; url: string }
  | { key: string; ok: false; message: string }

export async function uploadProductImagesAction(
  formData: FormData
): Promise<
  { ok: true; results: UploadedImageResult[] } | { ok: false; message: string }
> {
  // A Server Action is a POST endpoint the `/admin` layout guard never runs
  // for — repeated here for the same reason every other product action
  // repeats it. See docs/admin-access-control.md.
  if (!(await isAdmin())) {
    return { ok: false, message: "ليست لديك صلاحية لرفع الصور." }
  }

  const keys = formData
    .getAll("imageKey")
    .filter((value): value is string => typeof value === "string")
  const files = formData.getAll("image")

  const results = await Promise.all(
    keys.map(async (key, index): Promise<UploadedImageResult> => {
      const file = files[index]

      if (!(file instanceof File) || file.size === 0) {
        return { key, ok: false, message: "لم يصل أي ملف." }
      }

      const parsed = galleryImage.safeParse(file)
      if (!parsed.success) {
        return {
          key,
          ok: false,
          message: parsed.error.issues[0]?.message ?? "ملف غير صالح.",
        }
      }

      try {
        const url = await saveImage(parsed.data)
        return { key, ok: true, url }
      } catch (error) {
        if (error instanceof UnsupportedImageError) {
          return {
            key,
            ok: false,
            message: `هذا الملف ليس صورة صالحة (${IMAGE_FORMATS_LABEL}).`,
          }
        }

        console.error("[upload-product-images] upload failed", error)
        return { key, ok: false, message: "تعذّر رفع الصورة إلى الخادم." }
      }
    })
  )

  return { ok: true, results }
}
