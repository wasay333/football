'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/upload'
import { getAdminSession } from '@/lib/admin-session'

const FootballerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  club: z.string().optional(),
  nationality: z.string().optional(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
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
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  const textResult = FootballerSchema.omit({
    profileImage: true,
  }).safeParse({
    name: formData.get('name'),
    position: formData.get('position') || undefined,
    club: formData.get('club') || undefined,
    nationality: formData.get('nationality') || undefined,
    bio: formData.get('bio') || undefined,
  })

  if (!textResult.success) {
    return { errors: textResult.error.flatten().fieldErrors }
  }

  let profileImage: string | undefined
  const newlyUploaded: string[] = []

  try {
    const fProfile = formData.get('profileImage') as File | null

    if (fProfile?.size) { profileImage = await saveUploadedFile(fProfile, 'footballers/images'); newlyUploaded.push(profileImage) }
  } catch {
    await Promise.all(newlyUploaded.map(deleteUploadedFile))
    return { errors: { form: ['Failed to save uploaded files. Please try again.'] } }
  }

  try {
    await prisma.footballer.create({
      data: {
        name: textResult.data.name,
        position: textResult.data.position ?? null,
        club: textResult.data.club ?? null,
        nationality: textResult.data.nationality ?? null,
        bio: textResult.data.bio ?? null,
        profileImage: profileImage ?? null,
        image1: null,
        image2: null,
        image3: null,
        videoUrl: null,
        videoThumbnail: null,
      },
    })
  } catch (e) {
    await Promise.all(newlyUploaded.map(deleteUploadedFile))
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
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  // Fetch current file paths so we can delete replaced files afterwards
  const existing = await prisma.footballer.findUnique({
    where: { id },
    select: { profileImage: true, image1: true, image2: true, image3: true, videoUrl: true, videoThumbnail: true },
  })

  const textResult = FootballerSchema.omit({
    profileImage: true,
  }).safeParse({
    name: formData.get('name'),
    position: formData.get('position') || undefined,
    club: formData.get('club') || undefined,
    nationality: formData.get('nationality') || undefined,
    bio: formData.get('bio') || undefined,
  })

  if (!textResult.success) {
    return { errors: textResult.error.flatten().fieldErrors }
  }

  let profileImage: string | undefined
  const newlyUploaded: string[] = []
  const filesToDelete: (string | null | undefined)[] = []

  try {
    const fProfile = formData.get('profileImage') as File | null

    if (fProfile?.size) { profileImage = await saveUploadedFile(fProfile, 'footballers/images'); newlyUploaded.push(profileImage); filesToDelete.push(existing?.profileImage) }
    else                { profileImage = existing?.profileImage ?? undefined }

    filesToDelete.push(existing?.image1, existing?.image2, existing?.image3, existing?.videoUrl, existing?.videoThumbnail)
  } catch {
    await Promise.all(newlyUploaded.map(deleteUploadedFile))
    return { errors: { form: ['Failed to save uploaded files. Please try again.'] } }
  }

  try {
    await prisma.footballer.update({
      where: { id },
      data: {
        name: textResult.data.name,
        position: textResult.data.position ?? null,
        club: textResult.data.club ?? null,
        nationality: textResult.data.nationality ?? null,
        bio: textResult.data.bio ?? null,
        profileImage: profileImage ?? null,
        image1: null,
        image2: null,
        image3: null,
        videoUrl: null,
        videoThumbnail: null,
      },
    })
  } catch (e) {
    await Promise.all(newlyUploaded.map(deleteUploadedFile))
    if (process.env.NODE_ENV === 'development') console.error('[updateFootballerAction]', e)
    return { errors: { form: ['Failed to update footballer. Please try again.'] } }
  }

  // Delete replaced files after successful DB update
  await Promise.all(filesToDelete.map(deleteUploadedFile))

  revalidatePath('/admin/footballers')
  redirect('/admin/footballers')
}

export async function deleteFootballerAction(id: string): Promise<{ error?: string }> {
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

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
