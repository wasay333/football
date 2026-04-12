'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/upload'

const FootballerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  club: z.string().optional(),
  nationality: z.string().optional(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  image1: z.string().optional(),
  image2: z.string().optional(),
  image3: z.string().optional(),
  videoUrl: z.string().optional(),
  videoThumbnail: z.string().optional(),
})

export type FootballerFormState = {
  errors?: {
    name?: string[]
    form?: string[]
  }
} | null

export async function createFootballerAction(
  _prevState: FootballerFormState,
  formData: FormData,
): Promise<FootballerFormState> {
  // Save any uploaded files (all optional)
  let profileImage: string | undefined
  let image1: string | undefined
  let image2: string | undefined
  let image3: string | undefined
  let videoUrl: string | undefined
  let videoThumbnail: string | undefined

  try {
    const fProfile = formData.get('profileImage') as File | null
    const fImg1    = formData.get('image1') as File | null
    const fImg2    = formData.get('image2') as File | null
    const fImg3    = formData.get('image3') as File | null
    const fVideo   = formData.get('videoUrl') as File | null
    const fThumb   = formData.get('videoThumbnail') as File | null

    if (fProfile?.size) profileImage   = await saveUploadedFile(fProfile, 'footballers/images')
    if (fImg1?.size)    image1         = await saveUploadedFile(fImg1,    'footballers/images')
    if (fImg2?.size)    image2         = await saveUploadedFile(fImg2,    'footballers/images')
    if (fImg3?.size)    image3         = await saveUploadedFile(fImg3,    'footballers/images')
    if (fVideo?.size)   videoUrl       = await saveUploadedFile(fVideo,   'footballers/videos')
    if (fThumb?.size)   videoThumbnail = await saveUploadedFile(fThumb,   'footballers/images')
  } catch {
    return { errors: { form: ['Failed to save uploaded files. Please try again.'] } }
  }

  const raw = {
    name: formData.get('name'),
    position: formData.get('position') || undefined,
    club: formData.get('club') || undefined,
    nationality: formData.get('nationality') || undefined,
    bio: formData.get('bio') || undefined,
    profileImage,
    image1,
    image2,
    image3,
    videoUrl,
    videoThumbnail,
  }

  const result = FootballerSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    await prisma.footballer.create({
      data: {
        name: result.data.name,
        position: result.data.position ?? null,
        club: result.data.club ?? null,
        nationality: result.data.nationality ?? null,
        bio: result.data.bio ?? null,
        profileImage: result.data.profileImage ?? null,
        image1: result.data.image1 ?? null,
        image2: result.data.image2 ?? null,
        image3: result.data.image3 ?? null,
        videoUrl: result.data.videoUrl ?? null,
        videoThumbnail: result.data.videoThumbnail ?? null,
      },
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('[createFootballerAction]', e)
    return { errors: { form: ['Failed to create footballer. Please try again.'] } }
  }

  revalidatePath('/admin/footballers')
  redirect('/admin/footballers')
}

export async function updateFootballerAction(
  id: string,
  _prevState: FootballerFormState,
  formData: FormData,
): Promise<FootballerFormState> {
  // Fetch current file paths so we can delete replaced files afterwards
  const existing = await prisma.footballer.findUnique({
    where: { id },
    select: { profileImage: true, image1: true, image2: true, image3: true, videoUrl: true, videoThumbnail: true },
  })

  let profileImage: string | undefined
  let image1: string | undefined
  let image2: string | undefined
  let image3: string | undefined
  let videoUrl: string | undefined
  let videoThumbnail: string | undefined
  const filesToDelete: (string | null | undefined)[] = []

  try {
    const fProfile = formData.get('profileImage') as File | null
    const fImg1    = formData.get('image1') as File | null
    const fImg2    = formData.get('image2') as File | null
    const fImg3    = formData.get('image3') as File | null
    const fVideo   = formData.get('videoUrl') as File | null
    const fThumb   = formData.get('videoThumbnail') as File | null

    if (fProfile?.size) { profileImage   = await saveUploadedFile(fProfile, 'footballers/images'); filesToDelete.push(existing?.profileImage) }
    else                { profileImage   = formData.get('profileImage_existing') as string || undefined }

    if (fImg1?.size)    { image1         = await saveUploadedFile(fImg1,    'footballers/images'); filesToDelete.push(existing?.image1) }
    else                { image1         = formData.get('image1_existing') as string || undefined }

    if (fImg2?.size)    { image2         = await saveUploadedFile(fImg2,    'footballers/images'); filesToDelete.push(existing?.image2) }
    else                { image2         = formData.get('image2_existing') as string || undefined }

    if (fImg3?.size)    { image3         = await saveUploadedFile(fImg3,    'footballers/images'); filesToDelete.push(existing?.image3) }
    else                { image3         = formData.get('image3_existing') as string || undefined }

    if (fVideo?.size)   { videoUrl       = await saveUploadedFile(fVideo,   'footballers/videos'); filesToDelete.push(existing?.videoUrl) }
    else                { videoUrl       = formData.get('videoUrl_existing') as string || undefined }

    if (fThumb?.size)   { videoThumbnail = await saveUploadedFile(fThumb,   'footballers/images'); filesToDelete.push(existing?.videoThumbnail) }
    else                { videoThumbnail = formData.get('videoThumbnail_existing') as string || undefined }
  } catch {
    return { errors: { form: ['Failed to save uploaded files. Please try again.'] } }
  }

  const raw = {
    name: formData.get('name'),
    position: formData.get('position') || undefined,
    club: formData.get('club') || undefined,
    nationality: formData.get('nationality') || undefined,
    bio: formData.get('bio') || undefined,
    profileImage,
    image1,
    image2,
    image3,
    videoUrl,
    videoThumbnail,
  }

  const result = FootballerSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    await prisma.footballer.update({
      where: { id },
      data: {
        name: result.data.name,
        position: result.data.position ?? null,
        club: result.data.club ?? null,
        nationality: result.data.nationality ?? null,
        bio: result.data.bio ?? null,
        profileImage: result.data.profileImage ?? null,
        image1: result.data.image1 ?? null,
        image2: result.data.image2 ?? null,
        image3: result.data.image3 ?? null,
        videoUrl: result.data.videoUrl ?? null,
        videoThumbnail: result.data.videoThumbnail ?? null,
      },
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('[updateFootballerAction]', e)
    return { errors: { form: ['Failed to update footballer. Please try again.'] } }
  }

  // Delete replaced files after successful DB update
  await Promise.all(filesToDelete.map(deleteUploadedFile))

  revalidatePath('/admin/footballers')
  redirect('/admin/footballers')
}

export async function deleteFootballerAction(id: string): Promise<{ error?: string }> {
  // Fetch file paths before deleting the record
  const existing = await prisma.footballer.findUnique({
    where: { id },
    select: { profileImage: true, image1: true, image2: true, image3: true, videoUrl: true, videoThumbnail: true },
  })

  try {
    await prisma.footballer.delete({ where: { id } })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2003') {
      return { error: 'Cannot delete — this footballer has existing products. Delete or reassign the products first.' }
    }
    return { error: 'Failed to delete footballer. Please try again.' }
  }

  // Remove all associated files after successful DB delete
  if (existing) {
    await Promise.all(
      [existing.profileImage, existing.image1, existing.image2, existing.image3, existing.videoUrl, existing.videoThumbnail]
        .map(deleteUploadedFile)
    )
  }

  revalidatePath('/admin/footballers')
  redirect('/admin/footballers')
}
