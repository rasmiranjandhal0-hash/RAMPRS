'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { ClothingSize, FitType, formatRupees } from '@ramprs/shared';
import { createClient } from '@/lib/supabase/client';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProductMatrixBuilderProps {
  categories: CategoryOption[];
  existingProducts: any[];
}

interface MatrixVariantRow {
  sku: string;
  size: ClothingSize;
  color_name: string;
  color_hex: string;
  mrp_rupees: number;
  sale_price_rupees: number;
  stock_quantity: number;
  image_url: string;
}

export const ProductMatrixBuilder: React.FC<ProductMatrixBuilderProps> = ({
  categories,
  existingProducts,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fabricCare, setFabricCare] = useState('');
  const [fitType, setFitType] = useState<FitType>('OVERSIZED');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [isFeatured, setIsFeatured] = useState(false);

  // Matrix generation inputs
  const [selectedSizes, setSelectedSizes] = useState<ClothingSize[]>(['S', 'M', 'L', 'XL']);
  const [colorInput, setColorInput] = useState('Phantom Black');
  const [colorHex, setColorHex] = useState('#0a0a0a');
  const [defaultMrp, setDefaultMrp] = useState(1999);
  const [defaultSalePrice, setDefaultSalePrice] = useState(1499);
  const [defaultStock, setDefaultStock] = useState(25);
  const [defaultImage, setDefaultImage] = useState(
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200'
  );

  // Generated variant matrix
  const [variantRows, setVariantRows] = useState<MatrixVariantRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);
  };

  const toggleSize = (size: ClothingSize) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const generateMatrixRows = () => {
    if (!slug) return;
    const cleanColor = colorInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'CLR';

    const newRows: MatrixVariantRow[] = selectedSizes.map((size) => {
      const cleanSlugPrefix = slug.toUpperCase().slice(0, 8);
      const sku = `RAMPRS-${cleanSlugPrefix}-${cleanColor}-${size}`;
      return {
        sku,
        size,
        color_name: colorInput,
        color_hex: colorHex,
        mrp_rupees: defaultMrp,
        sale_price_rupees: defaultSalePrice,
        stock_quantity: defaultStock,
        image_url: defaultImage,
      };
    });

    setVariantRows([...variantRows, ...newRows]);
  };

  const removeRow = (index: number) => {
    setVariantRows(variantRows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof MatrixVariantRow, value: any) => {
    const updated = [...variantRows];
    updated[index] = { ...updated[index], [field]: value };
    setVariantRows(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !categoryId || variantRows.length === 0) {
      setStatusMessage('Please fill all required product fields and generate at least 1 variant SKU row.');
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage('');

      // 1. Create Product
      const defaultSizeChart = {
        measurements: [
          { size: 'XS', chest_in: 40, waist_in: 39, length_in: 27, shoulder_in: 19.5, chest_cm: 101.6, waist_cm: 99.0, length_cm: 68.5, shoulder_cm: 49.5 },
          { size: 'S', chest_in: 42, waist_in: 41, length_in: 28, shoulder_in: 20.5, chest_cm: 106.6, waist_cm: 104.1, length_cm: 71.1, shoulder_cm: 52.0 },
          { size: 'M', chest_in: 44, waist_in: 43, length_in: 29, shoulder_in: 21.5, chest_cm: 111.7, waist_cm: 109.2, length_cm: 73.6, shoulder_cm: 54.6 },
          { size: 'L', chest_in: 46, waist_in: 45, length_in: 30, shoulder_in: 22.5, chest_cm: 116.8, waist_cm: 114.3, length_cm: 76.2, shoulder_cm: 57.1 },
          { size: 'XL', chest_in: 48, waist_in: 47, length_in: 31, shoulder_in: 23.5, chest_cm: 121.9, waist_cm: 119.3, length_cm: 78.7, shoulder_cm: 59.6 },
          { size: 'XXL', chest_in: 50, waist_in: 49, length_in: 32, shoulder_in: 24.5, chest_cm: 127.0, waist_cm: 124.4, length_cm: 81.2, shoulder_cm: 62.2 },
        ],
        fit_notes: 'Standard RAMPRS precision measurement profile.',
      };

      const { data: createdProduct, error: prodErr } = await supabase
        .from('products')
        .insert({
          title,
          slug,
          description: description || 'High-thread luxury garment crafted with bespoke tailoring in India.',
          fabric_care: fabricCare || '100% Cotton. Gentle wash inside out. Line dry in shade.',
          fit_type: fitType,
          category_id: categoryId,
          is_featured: isFeatured,
          is_active: true,
          size_chart_json: defaultSizeChart,
        })
        .select('*')
        .single();

      if (prodErr || !createdProduct) {
        throw new Error(prodErr?.message || 'Failed to create product record');
      }

      // 2. Insert Variant Rows in Paise
      const variantsToInsert = variantRows.map((r) => ({
        product_id: createdProduct.id,
        sku: r.sku,
        size: r.size,
        color_name: r.color_name,
        color_hex: r.color_hex,
        mrp_paise: Math.round(r.mrp_rupees * 100),
        sale_price_paise: Math.round(r.sale_price_rupees * 100),
        stock_quantity: Number(r.stock_quantity),
        images: [r.image_url],
      }));

      const { error: varErr } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (varErr) {
        throw new Error(varErr.message);
      }

      setStatusMessage('✅ Garment and multi-variant matrix successfully published!');
      router.refresh();
      // Reset form
      setTitle('');
      setSlug('');
      setVariantRows([]);
    } catch (err: any) {
      console.error('Save product error:', err);
      setStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Existing Products Count */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Inventory Matrix</span>
          <h1 className="text-2xl font-black uppercase tracking-luxury text-black mt-1">
            Product & SKU Matrix Builder
          </h1>
        </div>
        <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase rounded">
          {existingProducts.length} Live Products
        </span>
      </div>

      {statusMessage && (
        <div className="p-4 bg-neutral-100 border border-neutral-300 rounded text-xs font-bold text-black">
          {statusMessage}
        </div>
      )}

      {/* Product Creator Form */}
      <form onSubmit={handleSaveProduct} className="bg-white p-6 sm:p-8 rounded-lg border border-neutral-200 shadow-sm space-y-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black pb-3 border-b border-neutral-100 flex items-center gap-2">
          <Layers size={16} /> 1. Garment Master Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Garment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Heavyweight Boxy Tee"
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">URL Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="heavyweight-boxy-tee"
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black font-mono"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-neutral-700 mb-1">Fit Silhouette</label>
            <select
              value={fitType}
              onChange={(e) => setFitType(e.target.value as FitType)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
            >
              <option value="OVERSIZED">OVERSIZED</option>
              <option value="RELAXED">RELAXED</option>
              <option value="REGULAR">REGULAR</option>
              <option value="SLIM">SLIM</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold uppercase text-neutral-700 mb-1">Fabric & Wash Care</label>
            <input
              type="text"
              value={fabricCare}
              onChange={(e) => setFabricCare(e.target.value)}
              placeholder="100% Combed Cotton, 240 GSM. Machine wash cold."
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block font-bold uppercase text-neutral-700 mb-1">Product Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Crafted from luxury combed cotton..."
              className="w-full px-3 py-2.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <label htmlFor="is_featured" className="font-bold uppercase text-neutral-700">
              Highlight as Featured Drop on Homepage
            </label>
          </div>
        </div>

        {/* 2. Automated Variant Matrix Generator */}
        <div className="pt-6 border-t border-neutral-200 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Sparkles size={16} /> 2. Automated Multi-Variant Matrix Generator
            </h2>
          </div>

          <div className="p-4 bg-neutral-50 rounded border border-neutral-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-neutral-700 mb-1">Color Name & Hex</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="Phantom Black"
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded"
                />
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-9 h-8 p-0 border border-neutral-300 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-neutral-700 mb-1">MRP / Sale Price (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={defaultMrp}
                  onChange={(e) => setDefaultMrp(Number(e.target.value))}
                  className="w-1/2 px-2 py-1.5 border border-neutral-300 rounded"
                  placeholder="MRP"
                />
                <input
                  type="number"
                  value={defaultSalePrice}
                  onChange={(e) => setDefaultSalePrice(Number(e.target.value))}
                  className="w-1/2 px-2 py-1.5 border border-neutral-300 rounded font-bold"
                  placeholder="Sale Price"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-neutral-700 mb-1">Default Stock Per Size</label>
              <input
                type="number"
                value={defaultStock}
                onChange={(e) => setDefaultStock(Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-neutral-300 rounded"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-neutral-700 mb-1">Image URL</label>
              <input
                type="url"
                value={defaultImage}
                onChange={(e) => setDefaultImage(e.target.value)}
                className="w-full px-2 py-1.5 border border-neutral-300 rounded"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold uppercase text-neutral-700 mb-1">Select Sizes for Matrix</label>
              <div className="flex gap-2">
                {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ClothingSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                      selectedSizes.includes(sz) ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={generateMatrixRows}
                className="w-full py-2 bg-neutral-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Generate SKU Rows
              </button>
            </div>
          </div>
        </div>

        {/* 3. Generated Matrix Table */}
        {variantRows.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              Resolved Variant SKU Matrix ({variantRows.length} Rows)
            </h3>
            <div className="overflow-x-auto border border-neutral-200 rounded">
              <table className="w-full text-xs divide-y divide-neutral-200">
                <thead className="bg-neutral-50 font-bold uppercase text-neutral-600">
                  <tr>
                    <th className="p-2.5 text-left">Generated SKU</th>
                    <th className="p-2.5 text-center">Size</th>
                    <th className="p-2.5 text-left">Color</th>
                    <th className="p-2.5 text-right">MRP (₹)</th>
                    <th className="p-2.5 text-right">Sale Price (₹)</th>
                    <th className="p-2.5 text-center">Stock</th>
                    <th className="p-2.5 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {variantRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono font-bold text-black">{row.sku}</td>
                      <td className="p-2 text-center font-bold">{row.size}</td>
                      <td className="p-2 flex items-center gap-1.5">
                        <span style={{ backgroundColor: row.color_hex }} className="w-3 h-3 rounded-full border border-neutral-300" />
                        {row.color_name}
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={row.mrp_rupees}
                          onChange={(e) => updateRow(idx, 'mrp_rupees', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-neutral-200 rounded text-right"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={row.sale_price_rupees}
                          onChange={(e) => updateRow(idx, 'sale_price_rupees', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-neutral-200 rounded text-right font-bold"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={row.stock_quantity}
                          onChange={(e) => updateRow(idx, 'stock_quantity', Number(e.target.value))}
                          className="w-16 px-1.5 py-1 border border-neutral-200 rounded text-center"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="text-neutral-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={submitting || variantRows.length === 0}
            className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-luxury hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors rounded-sm"
          >
            {submitting ? 'Publishing Matrix...' : 'Publish Product & Variant Matrix'}
          </button>
        </div>
      </form>
    </div>
  );
};

