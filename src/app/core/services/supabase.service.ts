import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const isConfigured =
  environment.supabaseUrl.startsWith('http') &&
  environment.supabaseKey.length > 10;

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = isConfigured
    ? createClient(environment.supabaseUrl, environment.supabaseKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key-not-configured');

  // ── Storage ────────────────────────────────────────────────

  async uploadRecipePhoto(file: File, familyId: string, recipeId: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${familyId}/${recipeId}.${ext}`;
    const { error } = await this.client.storage
      .from('recipe-photos')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return this.getPublicUrl('recipe-photos', path);
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}.${ext}`;
    const { error } = await this.client.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return this.getPublicUrl('avatars', path);
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    await this.client.storage.from(bucket).remove([path]);
  }

  private getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
