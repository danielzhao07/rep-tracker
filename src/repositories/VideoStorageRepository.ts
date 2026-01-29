import { supabase } from '@/lib/supabase'

export class VideoStorageRepository {
  private bucket = 'workout-videos'

  async uploadVideo(
    userId: string,
    workoutId: string,
    blob: Blob
  ): Promise<string> {
    const path = `${userId}/${workoutId}.webm`
    
    console.log(`📤 Uploading video to Supabase Storage...`)
    console.log(`   Bucket: ${this.bucket}`)
    console.log(`   Path: ${path}`)
    console.log(`   Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, blob, {
        contentType: 'video/webm',
        upsert: true,
      })

    if (error) {
      console.error('❌ Video upload failed:', error.message)
      throw error
    }

    // Try public URL first (if bucket is public)
    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path)

    console.log(`✅ Video uploaded successfully!`)
    console.log(`   Public URL: ${urlData.publicUrl}`)

    // Store the path instead of URL - we'll generate signed URLs on retrieval
    // This is more reliable since bucket settings can vary
    return urlData.publicUrl
  }

  /**
   * Get a playable URL for a video
   * Uses signed URL for better security and reliability
   */
  async getVideoUrl(videoUrl: string): Promise<string> {
    // If it's already a full URL, try to extract the path
    // Format: https://xxx.supabase.co/storage/v1/object/public/workout-videos/userId/workoutId.webm
    const pathMatch = videoUrl.match(/workout-videos\/(.+)$/)
    if (!pathMatch) {
      return videoUrl // Return as-is if we can't parse it
    }

    const path = pathMatch[1]
    
    // Generate a signed URL that's valid for 1 hour
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error || !data) {
      console.warn('Failed to create signed URL, using public URL')
      return videoUrl
    }

    return data.signedUrl
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
