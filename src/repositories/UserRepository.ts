import { supabase } from '@/lib/supabase'

export class UserRepository {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  async updateEmail(email: string) {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw error
  }

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }
}
