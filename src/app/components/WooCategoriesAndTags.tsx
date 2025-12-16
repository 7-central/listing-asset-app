'use client';

import { useState, useEffect } from 'react';
import { WooCategoryTag } from '@/lib/types';

type WooCategoriesAndTagsProps = {
  selectedCategoryIds: number[];
  selectedTagIds: number[];
  onCategoriesChange: (ids: number[]) => void;
  onTagsChange: (ids: number[]) => void;
};

export default function WooCategoriesAndTags({
  selectedCategoryIds,
  selectedTagIds,
  onCategoriesChange,
  onTagsChange,
}: WooCategoriesAndTagsProps) {
  const [categories, setCategories] = useState<WooCategoryTag[]>([]);
  const [tags, setTags] = useState<WooCategoryTag[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/woocommerce/categories');
      const data = await response.json();
      if (data.ok) {
        setCategories(data.categories);
      } else {
        setErrorMessage(`Failed to load categories: ${data.error}`);
      }
    } catch (error) {
      setErrorMessage('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const response = await fetch('/api/woocommerce/tags');
      const data = await response.json();
      if (data.ok) {
        setTags(data.tags);
      } else {
        setErrorMessage(`Failed to load tags: ${data.error}`);
      }
    } catch (error) {
      setErrorMessage('Failed to load tags');
    } finally {
      setLoadingTags(false);
    }
  };

  const createCategory = async (name: string) => {
    setCreatingCategory(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/woocommerce/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (data.ok) {
        // Add to local state if not already present
        if (!categories.find((cat) => cat.id === data.category.id)) {
          setCategories([...categories, data.category]);
        }
        // Auto-select the new category
        onCategoriesChange([...selectedCategoryIds, data.category.id]);
        setCategorySearch('');
      } else {
        setErrorMessage(`Failed to create category: ${data.error}`);
      }
    } catch (error) {
      setErrorMessage('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const createTag = async (name: string) => {
    setCreatingTag(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/woocommerce/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (data.ok) {
        // Add to local state if not already present
        if (!tags.find((tag) => tag.id === data.tag.id)) {
          setTags([...tags, data.tag]);
        }
        // Auto-select the new tag
        onTagsChange([...selectedTagIds, data.tag.id]);
        setTagSearch('');
      } else {
        setErrorMessage(`Failed to create tag: ${data.error}`);
      }
    } catch (error) {
      setErrorMessage('Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && categorySearch.trim()) {
      e.preventDefault();
      createCategory(categorySearch.trim());
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagSearch.trim()) {
      e.preventDefault();
      createTag(tagSearch.trim());
    }
  };

  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      onCategoriesChange(selectedCategoryIds.filter((cid) => cid !== id));
    } else {
      onCategoriesChange([...selectedCategoryIds, id]);
    }
  };

  const toggleTag = (id: number) => {
    if (selectedTagIds.includes(id)) {
      onTagsChange(selectedTagIds.filter((tid) => tid !== id));
    } else {
      onTagsChange([...selectedTagIds, id]);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const selectedCategories = categories.filter((cat) =>
    selectedCategoryIds.includes(cat.id)
  );

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Categories */}
      <div>
        <label className="block font-medium mb-2">Categories</label>

        {/* Selected categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCategories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {cat.name}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <input
          type="text"
          placeholder="Search or type to create new category (press Enter)"
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          onKeyDown={handleCategoryKeyDown}
          disabled={loadingCategories || creatingCategory}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 mb-2"
        />

        {creatingCategory && (
          <p className="text-sm text-gray-600 mb-2">Creating category...</p>
        )}

        {/* Category list */}
        {loadingCategories ? (
          <p className="text-sm text-gray-500">Loading categories...</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-gray-500">
                {categorySearch
                  ? 'No matching categories. Press Enter to create a new one.'
                  : 'No categories available.'}
              </p>
            ) : (
              filteredCategories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block font-medium mb-2">Tags</label>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="ml-2 text-purple-600 hover:text-purple-800 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <input
          type="text"
          placeholder="Search or type to create new tag (press Enter)"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          onKeyDown={handleTagKeyDown}
          disabled={loadingTags || creatingTag}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 mb-2"
        />

        {creatingTag && <p className="text-sm text-gray-600 mb-2">Creating tag...</p>}

        {/* Tag list */}
        {loadingTags ? (
          <p className="text-sm text-gray-500">Loading tags...</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
            {filteredTags.length === 0 ? (
              <p className="text-sm text-gray-500">
                {tagSearch
                  ? 'No matching tags. Press Enter to create a new one.'
                  : 'No tags available.'}
              </p>
            ) : (
              filteredTags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
