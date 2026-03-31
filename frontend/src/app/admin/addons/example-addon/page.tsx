import type { Metadata } from 'next'

import { ExampleAddonAdminDemo } from '@/components/addons/example-addon-admin-demo'

export const metadata: Metadata = {
  title: 'Example Addon',
  description: 'Sample modular addon admin surface.',
}

export default function ExampleAddonAdminPage() {
  return <ExampleAddonAdminDemo />
}
