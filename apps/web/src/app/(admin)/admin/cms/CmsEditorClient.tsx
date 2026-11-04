'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, CheckCircle2, Save, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CmsEditorClientProps {
  initialCms: any;
  categories: any[];
}

export const CmsEditorClient: React.FC<CmsEditorClientProps> = ({
  initialCms,
  categories,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const [heroTitle, setHeroTitle] = useState(initialCms?.hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(initialCms?.hero_subtitle || '');
  const [heroImageUrl, setHeroImageUrl] = useState(initialCms?.hero_image_url || '');
  const [heroCtaLink, setHeroCtaLink] = useState(initialCms?.hero_cta_link || '/shop');
  const [announcementText, setAnnouncementText] = useState(initialCms?.announcement_bar_text || '');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(initialCms?.is_announcement_active ?? true);
  const [featuredLookbookSlug, setFeaturedLookbookSlug] = useState(initialCms?.featured_lookbook_slug || 'autumn-winter-2026');

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage('');

      const { error } = await supabase
        .from('cms_settings')
        .upsert({
          id: initialCms?.id || 'a0000000-0000-0000-0000-000000000001',
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          hero_image_url: heroImageUrl,
          hero_cta_link: heroCtaLink,
          announcement_bar_text: announcementText,
          is_announcement_active: isAnnouncementActive,
          featured_lookbook_slug: featuredLookbookSlug,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      setStatusMessage('Storefront CMS configuration saved! Live website updated instantly.');
      router.refresh();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-neutral-200">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Atelier Visual Merchandising</span>
        <h1 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">
          Storefront CMS Editor
        </h1>
      </div>

      {statusMessage && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 rounded text-xs font-bold text-black flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-lg border border-neutral-200 shadow-sm space-y-6 text-xs">
        {/* Announcement Bar */}
        <div className="space-y-3 pb-6 border-b border-neutral-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
            <Palette size={16} /> 1. Top Announcement Bar
          </h2>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Announcement Text</label>
            <input
              type="text"
              required
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_announcement_active"
              checked={isAnnouncementActive}
              onChange={(e) => setIsAnnouncementActive(e.target.checked)}
            />
            <label htmlFor="is_announcement_active" className="font-bold uppercase text-neutral-700">
              Display Announcement Banner on Storefront
            </label>
          </div>
        </div>

        {/* Hero Banner Section */}
        <div className="space-y-4 pb-6 border-b border-neutral-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
            <ImageIcon size={16} /> 2. Homepage Hero Stage
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-neutral-700 mb-1">Hero Main Headline</label>
              <input
                type="text"
                required
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded font-black text-sm uppercase tracking-wider"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-neutral-700 mb-1">Hero Subtitle</label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-neutral-700 mb-1">Hero Background Image URL</label>
              <input
                type="url"
                required
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-neutral-700 mb-1">Call To Action (CTA) Link</label>
              <input
                type="text"
                value={heroCtaLink}
                onChange={(e) => setHeroCtaLink(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded font-mono"
              />
            </div>
          </div>
        </div>

        {/* Featured Lookbook */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-black">
            3. Featured Lookbook Campaign Slug
          </h2>
          <input
            type="text"
            value={featuredLookbookSlug}
            onChange={(e) => setFeaturedLookbookSlug(e.target.value)}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded font-mono"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-luxury hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors rounded-sm flex items-center gap-2"
          >
            <Save size={14} />
            {submitting ? 'Updating Live Store...' : 'Deploy Live CMS Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

