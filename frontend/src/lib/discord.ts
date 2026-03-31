/**
 * Build Discord CDN avatar URL from user id and avatar hash.
 * @see https://discord.com/developers/docs/reference#image-formatting
 */
export function getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null | undefined,
  options?: { size?: number; format?: 'png' | 'jpg' | 'webp' | 'gif' }
): string {
  if (!avatarHash) {
    return `https://cdn.discordapp.com/embed/avatars/0.png`
  }
  const size = options?.size ?? 128
  const format = options?.format ?? (avatarHash.startsWith('a_') ? 'gif' : 'png')
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=${size}`
}
