import React, { useState } from 'react';
import {
  Upload,
  FileText,
  FileImage,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  BookOpen,
} from 'lucide-react';
import type { MenuItem, KnowledgeDocument } from '../types/dashboard';

interface KnowledgeTabProps {
  documents: KnowledgeDocument[];
  menuItems: MenuItem[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onUploadDocument: (file: File) => Promise<void>;
  onDeleteDocument: (id: string) => void;
  onAddMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  documents,
  menuItems,
  onAddDocument,
  onUploadDocument,
  onDeleteDocument,
  onAddMenuItem,
  onDeleteMenuItem,
}) => {
  const [menuSearch, setMenuSearch] = useState('');
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Mains');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDesc, setDishDesc] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      await onUploadDocument(file);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: `${sizeMB} MB`,
        type: ext,
        uploadedAt: 'Just now',
        status: 'indexed',
      };
      onAddDocument(newDoc);
    }
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) return;
    const newItem: MenuItem = {
      id: `m-${Date.now()}`,
      name: dishName.trim(),
      category: dishCategory,
      price: parseFloat(dishPrice) || 12,
      description: dishDesc.trim() || 'Delicious restaurant specialty.',
      available: true,
    };
    onAddMenuItem(newItem);
    setDishName('');
    setDishPrice('');
    setDishDesc('');
    setShowAddDish(false);
  };

  const filteredMenu = menuItems.filter(
    (m) =>
      m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(menuSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="eyebrow text-slate-500">RAG & VECTOR KNOWLEDGE BASE</span>
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
            Menu Items & AI Knowledge
          </h2>
          <p className="text-xs text-slate-500">
            Upload menus and guidelines for Pinecone & LangGraph RAG grounding
          </p>
        </div>

        <button
          onClick={() => setShowAddDish(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#d9e85a] px-3.5 py-2 text-xs font-bold text-[#143936] transition hover:bg-[#cbdc3f]"
        >
          <Plus size={15} />
          <span>Add Menu Dish</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="upload-zone rounded-xl border-2 border-dashed border-[#adc7b9] bg-[#f5f9f6] p-8 text-center">
        <input
          type="file"
          id="doc-upload"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
        />
        <label htmlFor="doc-upload" className="cursor-pointer">
          <div className="upload-cloud mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#dbeae1] text-[#204d49]">
            <Upload size={22} />
          </div>
          <h3 className="mt-3 font-['Space_Grotesk'] text-base font-bold text-[#19403d]">
            Drop restaurant menus, specials, or policy files here, or <u>browse</u>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            PDF, DOCX, TXT, PNG or JPG · Pearson AI vectors will index dishes and ingredients automatically
          </p>
        </label>
      </div>

      {/* Indexed Documents List */}
      <div className="panel">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#153e3b]" />
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
              Indexed Documents ({documents.length})
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Vector RAG Synced</span>
          </span>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#1b4845]">
                  {doc.type === 'PDF' ? <FileText size={18} /> : <FileImage size={18} />}
                </div>
                <div>
                  <strong className="text-xs font-semibold text-slate-900">{doc.name}</strong>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Indexed · Ready for AI
                </span>
                <button
                  onClick={() => onDeleteDocument(doc.id)}
                  className="rounded p-1 text-slate-400 hover:text-rose-600"
                  title="Remove document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Menu Catalog Table */}
      <div className="panel">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
              Live Dish Catalog ({menuItems.length})
            </h3>
            <p className="text-xs text-slate-500">Items Pearson agent can recommend & take orders for</p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search dishes or categories..."
              className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#76a495]"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Dish</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Price</th>
                <th className="px-3 py-2.5 font-semibold">Description</th>
                <th className="px-3 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenu.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{m.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-800">
                    ${m.price.toFixed(2)}
                  </td>
                  <td className="max-w-xs px-3 py-2.5 text-slate-500 truncate">
                    {m.description}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onDeleteMenuItem(m.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dish Modal */}
      {showAddDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">
              Add New Dish to Menu
            </h3>
            <form onSubmit={handleCreateDish} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Saffron Risotto"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="18"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">Description</label>
                <textarea
                  rows={2}
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="Ingredients, flavors, allergen notice..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDish(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#d9e85a] px-4 py-1.5 text-xs font-bold text-[#143936]"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
