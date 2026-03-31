'use client';

import { TabContainer } from '@/components/admin/legal/tab-container';
import { Suspense } from 'react';

export default function LegalPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Legal Information</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <TabContainer />
      </Suspense>
    </div>
  );
} 