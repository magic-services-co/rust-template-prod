
function checkUploadsEnabled(): boolean {
  if (typeof process === 'undefined') return true
  const v = process.env.NEXT_PUBLIC_UPLOADS_ENABLED
  if (v === undefined || v === '') return true
  return v === '1' || v.toLowerCase() === 'true'
}

export const isUploadsEnabled = checkUploadsEnabled()
