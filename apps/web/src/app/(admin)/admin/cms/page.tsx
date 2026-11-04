import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CmsEditorClient } from './CmsEditorClient';

export const revalidate = 0;

export default async function AdminCmsPage() {
  const supabase = createClient();

  const { data: cms } = await supabase
    .from('cms_settings')
    .select('*')
    .single();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  return (
    <CmsEditorClient
      initialCms={cms}
      categories={categories || []}
    />
  );
}

