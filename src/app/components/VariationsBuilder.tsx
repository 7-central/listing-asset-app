'use client';

import { useState } from 'react';
import { WooVariationAttribute } from '@/lib/types';

type VariationsBuilderProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  attributes: WooVariationAttribute[];
  onAttributesChange: (attributes: WooVariationAttribute[]) => void;
};

export default function VariationsBuilder({
  enabled,
  onEnabledChange,
  attributes,
  onAttributesChange,
}: VariationsBuilderProps) {
  const [attributeInputs, setAttributeInputs] = useState<
    { name: string; values: string }[]
  >(
    attributes.length > 0
      ? attributes.map((attr) => ({ name: attr.name, values: attr.options.join(', ') }))
      : [{ name: '', values: '' }]
  );

  const handleAddAttribute = () => {
    setAttributeInputs([...attributeInputs, { name: '', values: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    const newInputs = attributeInputs.filter((_, i) => i !== index);
    setAttributeInputs(newInputs);
    updateAttributes(newInputs);
  };

  const handleAttributeChange = (
    index: number,
    field: 'name' | 'values',
    value: string
  ) => {
    const newInputs = [...attributeInputs];
    newInputs[index][field] = value;
    setAttributeInputs(newInputs);
    updateAttributes(newInputs);
  };

  const updateAttributes = (inputs: { name: string; values: string }[]) => {
    const parsedAttributes: WooVariationAttribute[] = inputs
      .filter((input) => input.name.trim() && input.values.trim())
      .map((input) => {
        // Parse comma-separated values and sanitize
        const options = input.values
          .split(',')
          .map((val) => val.trim())
          .filter((val) => val.length > 0)
          // Dedupe case-insensitively
          .filter(
            (val, idx, arr) =>
              arr.findIndex((v) => v.toLowerCase() === val.toLowerCase()) === idx
          );

        return {
          name: input.name.trim().replace(/\s+/g, ' '),
          options,
        };
      });

    onAttributesChange(parsedAttributes);
  };

  const parseOptionsToChips = (valuesString: string): string[] => {
    return valuesString
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val.length > 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="variations-enabled"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="variations-enabled" className="font-medium">
          This product has variations
        </label>
      </div>

      {enabled && (
        <div className="space-y-4 pl-6">
          {attributeInputs.map((input, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-start space-x-2">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Attribute name (e.g., Colour, Size)"
                    value={input.name}
                    onChange={(e) =>
                      handleAttributeChange(index, 'name', e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />

                  <textarea
                    placeholder="Values (comma-separated, e.g., Red, Blue, Green)"
                    value={input.values}
                    onChange={(e) =>
                      handleAttributeChange(index, 'values', e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />

                  {input.values.trim() && (
                    <div className="flex flex-wrap gap-2">
                      {parseOptionsToChips(input.values).map((chip, chipIndex) => (
                        <span
                          key={chipIndex}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(index)}
                  className="text-red-600 hover:text-red-800 font-bold text-xl"
                  aria-label="Remove attribute"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddAttribute}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            + Add Attribute
          </button>

          {attributes.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-gray-700">
                <strong>Total variations to be created:</strong>{' '}
                {attributes.reduce((total, attr) => total * attr.options.length, 1)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
