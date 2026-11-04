import React from 'react';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { Navbar } from '@/components/store/Navbar';
import { CartDrawer } from '@/components/store/CartDrawer';
import { Footer } from '@/components/store/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Fetch CMS announcement settings
  const { data: cms } = await supabase
    .from('cms_settings')
    .select('announcement_bar_text, is_announcement_active')
    .single();

  // Fetch active categories for mega menu
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="flex-1 flex flex-col">
      <AnnouncementBar
        text={cms?.announcement_bar_text}
        isActive={cms?.is_announcement_active}
      />
      <Navbar categories={categories || []} />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <Footer />
    </div>
  );
}

