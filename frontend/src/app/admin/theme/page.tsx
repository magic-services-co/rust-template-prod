'use client';

import { TabContainer } from '@/components/admin/theme/tab-container';
import { Suspense } from 'react';

export default function ThemePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Theme Settings</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <TabContainer />
      </Suspense>
    </div>
  );
} 