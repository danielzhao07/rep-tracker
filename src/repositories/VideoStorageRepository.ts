import { supabase } from '@/lib/supabase'

export class VideoStorageRepository {
  private bucket = 'workout-videos'

  async uploadVideo(
    userId: string,
    workoutId: string,
    blob: Blob
  ): Promise<string> {
    const path = `${userId}/${workoutId}.webm`

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, blob, {
        contentType: 'video/webm',
        upsert: true,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path)

    return urlData.publicUrl
  }

  async getSignedUrl(
    userId: string,
    workoutId: string
  ): Promise<string | null> {
    const path = `${userId}/${workoutId}.webm`

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error) return null

    return data.signedUrl
  }

  async deleteVideo(userId: string, workoutId: string): Promise<void> {
    const path = `${userId}/${workoutId}.webm`

    const { error } = await supabase.storage.from(this.bucket).remove([path])

    if (error) throw error
  }
}
