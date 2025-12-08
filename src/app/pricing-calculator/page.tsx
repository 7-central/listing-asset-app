'use client';

import { useState } from 'react';
import { BillOfMaterialsItem, RoyalMailAdviceResponse, MarketplaceOption, MarketplaceFeeConfig } from '@/lib/types';

// Marketplace fee configurations
// Sources:
// - Etsy: ~6.5% transaction + ~3% + £0.25 payment processing = ~9.5% + £0.25
//   https://help.etsy.com/hc/en-us/articles/115015628847
// - WooCommerce (Stripe UK): 1.5% + £0.20 for UK cards, up to 3.25% + £0.20 for international
//   https://stripe.com/pricing
// - Amazon Handmade UK: 15% referral fee, no separate payment processing
//   https://sellercentral.amazon.co.uk/help/hub/reference/external/G201814220
// Note: These are approximate 2025 rates and should be reviewed periodically

const MARKETPLACE_FEES: Record<MarketplaceOption, MarketplaceFeeConfig> = {
  'all-worst-case': {
    name: 'All (worst case)',
    percentageFee: 15, // Highest across all platforms (Amazon)
    fixedFee: 0.25, // Highest fixed fee (Etsy)
    notes: 'Conservative estimate using highest fees across Etsy, WooCommerce, and Amazon Handmade'
  },
  'etsy': {
    name: 'Etsy',
    percentageFee: 9.5, // 6.5% transaction + 3% payment processing
    fixedFee: 0.25,
    notes: 'Includes transaction fee (6.5%) and payment processing (3% + £0.25)'
  },
  'woocommerce': {
    name: 'WooCommerce (Stripe)',
    percentageFee: 3.25, // Using international card rate for worst-case
    fixedFee: 0.20,
    notes: 'Stripe UK: 1.5% + £0.20 (UK cards) to 3.25% + £0.20 (international). Using higher rate.'
  },
  'amazon-handmade': {
    name: 'Amazon Handmade',
    percentageFee: 15, // Referral fee
    fixedFee: 0,
    notes: '15% referral fee on total sale (item + shipping). No separate payment processing fees.'
  }
};

export default function PricingCalculator() {
  // Bill of Materials state
  const [bomItems, setBomItems] = useState<BillOfMaterialsItem[]>([
    { id: '1', description: '', costPerUnit: 0 },
    { id: '2', description: '', costPerUnit: 0 },
    { id: '3', description: '', costPerUnit: 0 },
  ]);

  // Labour state
  const [labourTimeMinutes, setLabourTimeMinutes] = useState<number>(0);
  const [labourRatePerHour, setLabourRatePerHour] = useState<number>(25);

  // Overhead state
  const [overheadPercentage, setOverheadPercentage] = useState<number>(20);

  // Shipping state
  const [weightGrams, setWeightGrams] = useState<number>(0);
  const [widthMm, setWidthMm] = useState<number>(0);
  const [heightMm, setHeightMm] = useState<number>(0);
  const [depthMm, setDepthMm] = useState<number>(0);
  const [shippingOverheadPercentage, setShippingOverheadPercentage] = useState<number>(0);
  const [royalMailAdvice, setRoyalMailAdvice] = useState<RoyalMailAdviceResponse | null>(null);
  const [manualShippingCost, setManualShippingCost] = useState<number>(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Marketplace state
  const [marketplace, setMarketplace] = useState<MarketplaceOption>('all-worst-case');

  // VAT state
  const [vatPercentage, setVatPercentage] = useState<number>(20);

  // Calculated values
  const totalMaterialsCostNet = bomItems.reduce((sum, item) => sum + (item.costPerUnit || 0), 0);

  const labourCostPerUnitNet = (labourTimeMinutes / 60) * labourRatePerHour;

  const overheadCostPerUnitNet = (totalMaterialsCostNet + labourCostPerUnitNet) * (overheadPercentage / 100);

  const actualShippingCostNet = royalMailAdvice ? royalMailAdvice.estimatedCostNet : manualShippingCost;

  const shippingOverheadAmount = actualShippingCostNet * (shippingOverheadPercentage / 100);

  const suggestedShippingChargeNet = actualShippingCostNet + shippingOverheadAmount;

  const suggestedShippingChargeGross = suggestedShippingChargeNet * (1 + vatPercentage / 100);

  const baseCostPerUnitNet = totalMaterialsCostNet + labourCostPerUnitNet + overheadCostPerUnitNet + actualShippingCostNet;

  // Markup bands
  const markupBands = [30, 50, 100];

  // Functions
  const addBomRow = () => {
    const newId = (Math.max(...bomItems.map(item => parseInt(item.id)), 0) + 1).toString();
    setBomItems([...bomItems, { id: newId, description: '', costPerUnit: 0 }]);
  };

  const removeBomRow = (id: string) => {
    if (bomItems.length > 1) {
      setBomItems(bomItems.filter(item => item.id !== id));
    }
  };

  const updateBomItem = (id: string, field: 'description' | 'costPerUnit', value: string | number) => {
    setBomItems(bomItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateRoyalMailOptions = async () => {
    if (!weightGrams || !widthMm || !heightMm || !depthMm) {
      setShippingError('Please enter all shipping dimensions and weight');
      return;
    }

    setShippingLoading(true);
    setShippingError(null);

    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightGrams,
          widthMm,
          heightMm,
          depthMm,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to get Royal Mail advice');
      }

      setRoyalMailAdvice(data.advice);
      setManualShippingCost(data.advice.estimatedCostNet);
    } catch (error) {
      setShippingError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Royal Mail advice error:', error);
    } finally {
      setShippingLoading(false);
    }
  };

  const calculatePricingForMarkup = (markupPercentage: number) => {
    const netItemPrice = baseCostPerUnitNet * (1 + markupPercentage / 100);
    const grossItemPrice = netItemPrice * (1 + vatPercentage / 100);

    const netRevenue = netItemPrice + suggestedShippingChargeNet;
    const grossRevenue = grossItemPrice + suggestedShippingChargeGross;

    const marketplaceFeeConfig = MARKETPLACE_FEES[marketplace];
    const marketplaceFees = (grossRevenue * marketplaceFeeConfig.percentageFee / 100) + marketplaceFeeConfig.fixedFee;

    // Convert marketplace fees to net equivalent (divide by 1+VAT)
    const marketplaceFeesNet = marketplaceFees / (1 + vatPercentage / 100);

    const profitNet = netRevenue - baseCostPerUnitNet - marketplaceFeesNet;

    const effectiveMargin = netRevenue > 0 ? (profitNet / netRevenue) * 100 : 0;

    const profitPerHour = labourTimeMinutes > 0 ? profitNet / (labourTimeMinutes / 60) : 0;

    // Rounded price (to .95 or .99)
    const roundedGrossPrice = Math.ceil(grossItemPrice - 0.05) + 0.95;

    return {
      netItemPrice,
      grossItemPrice,
      roundedGrossPrice,
      netRevenue,
      grossRevenue,
      marketplaceFees,
      profitNet,
      effectiveMargin,
      profitPerHour,
    };
  };

  const formatCurrency = (value: number) => `£${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pricing Calculator</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Work out sustainable listing prices for Etsy, WooCommerce, and Amazon Handmade based on materials, labour, overheads, shipping, and marketplace fees.
        </p>

        {/* Bill of Materials Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Bill of Materials</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Enter all material costs per unit (net, excluding VAT)</p>

          <div className="space-y-3">
            {bomItems.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center border-b sm:border-0 pb-3 sm:pb-0">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateBomItem(item.id, 'description', e.target.value)}
                  placeholder="Part description (e.g., 14x14cm slate)"
                  className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 justify-between sm:justify-start">
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <span className="text-gray-600 text-sm">£</span>
                    <input
                      type="number"
                      value={item.costPerUnit || ''}
                      onChange={(e) => updateBomItem(item.id, 'costPerUnit', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full sm:w-24 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {bomItems.length > 1 && (
                    <button
                      onClick={() => removeBomRow(item.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md whitespace-nowrap"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addBomRow}
            className="mt-4 px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add line
          </button>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Total materials cost (net):</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(totalMaterialsCostNet)}</span>
            </div>
          </div>
        </div>

        {/* Labour Costs Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Labour Costs</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Calculate labour cost per unit (net, excluding VAT)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Labour time per unit (mins)
              </label>
              <input
                type="number"
                value={labourTimeMinutes || ''}
                onChange={(e) => setLabourTimeMinutes(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Labour rate (£/hour)
              </label>
              <input
                type="number"
                value={labourRatePerHour || ''}
                onChange={(e) => setLabourRatePerHour(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Labour cost per unit (net):</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(labourCostPerUnitNet)}</span>
            </div>
          </div>
        </div>

        {/* Overhead Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Overhead</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Business overheads as a percentage of materials + labour</p>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Overhead % on materials + labour
            </label>
            <input
              type="number"
              value={overheadPercentage || ''}
              onChange={(e) => setOverheadPercentage(parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full md:w-48 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Overhead cost per unit (net):</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(overheadCostPerUnitNet)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Shipping</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Get Royal Mail guidance based on your packed dimensions and weight. All costs are net (excluding VAT).
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Weight (g)
              </label>
              <input
                type="number"
                value={weightGrams || ''}
                onChange={(e) => setWeightGrams(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Width (mm)
              </label>
              <input
                type="number"
                value={widthMm || ''}
                onChange={(e) => setWidthMm(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Height (mm)
              </label>
              <input
                type="number"
                value={heightMm || ''}
                onChange={(e) => setHeightMm(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Depth (mm)
              </label>
              <input
                type="number"
                value={depthMm || ''}
                onChange={(e) => setDepthMm(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={calculateRoyalMailOptions}
            disabled={shippingLoading}
            className="px-4 py-2 text-sm sm:text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {shippingLoading ? 'Calculating...' : 'Calculate Royal Mail options'}
          </button>

          {shippingError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{shippingError}</p>
              <p className="text-red-600 text-xs mt-2">You can still enter a manual shipping cost below.</p>
            </div>
          )}

          {royalMailAdvice && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">Royal Mail Recommendation:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Service:</span> {royalMailAdvice.serviceName}</p>
                <p><span className="font-medium">Bracket:</span> {royalMailAdvice.bracket}</p>
                <p><span className="font-medium">Estimated cost (net):</span> {formatCurrency(royalMailAdvice.estimatedCostNet)}</p>
                <p><span className="font-medium">Max dimensions:</span> {royalMailAdvice.maxDimensionsMm.width}mm x {royalMailAdvice.maxDimensionsMm.height}mm x {royalMailAdvice.maxDimensionsMm.depth}mm</p>
              </div>
            </div>
          )}

          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Actual postage cost (net) - Manual override
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">£</span>
                <input
                  type="number"
                  value={manualShippingCost || ''}
                  onChange={(e) => setManualShippingCost(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Shipping overhead % (packaging, labels, etc.)
              </label>
              <input
                type="number"
                value={shippingOverheadPercentage || ''}
                onChange={(e) => setShippingOverheadPercentage(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between items-start sm:items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-700">Actual postage cost (net):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(actualShippingCostNet)}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center gap-2 text-xs sm:text-sm">
              <span className="text-gray-700">Shipping overhead amount (net):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(shippingOverheadAmount)}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center gap-2">
              <span className="font-semibold text-gray-900 text-xs sm:text-base">Suggested shipping charge to customer (net):</span>
              <span className="text-sm sm:text-lg font-bold text-gray-900">{formatCurrency(suggestedShippingChargeNet)}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center gap-2">
              <span className="font-semibold text-gray-900 text-xs sm:text-base">Suggested shipping charge (gross inc VAT):</span>
              <span className="text-sm sm:text-lg font-bold text-blue-600">{formatCurrency(suggestedShippingChargeGross)}</span>
            </div>
          </div>
        </div>

        {/* Marketplace & Fees Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Marketplace & Fees</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Select your marketplace to apply typical fees. These are approximate 2025 rates and should be reviewed periodically.
          </p>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Marketplace
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as MarketplaceOption)}
              className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all-worst-case">All (worst case)</option>
              <option value="etsy">Etsy</option>
              <option value="woocommerce">WooCommerce (Stripe)</option>
              <option value="amazon-handmade">Amazon Handmade</option>
            </select>
          </div>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Fee assumptions for {MARKETPLACE_FEES[marketplace].name}:</h3>
            <div className="space-y-1 text-xs sm:text-sm text-gray-700">
              <p><span className="font-medium">Percentage fee:</span> {formatPercentage(MARKETPLACE_FEES[marketplace].percentageFee)} (on item + shipping)</p>
              <p><span className="font-medium">Fixed per-order fee:</span> {formatCurrency(MARKETPLACE_FEES[marketplace].fixedFee)}</p>
              <p className="text-xs text-gray-600 mt-2">{MARKETPLACE_FEES[marketplace].notes}</p>
            </div>
          </div>
        </div>

        {/* VAT Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">VAT Settings</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            All input costs above are net (ex VAT). Listing prices will be shown as gross (inc VAT).
          </p>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              VAT %
            </label>
            <input
              type="number"
              value={vatPercentage || ''}
              onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="w-full md:w-48 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Pricing Summary Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Pricing Summary</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
            Suggested prices for different markup bands. The 50% markup band is highlighted as the recommended option.
          </p>

          {baseCostPerUnitNet === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                Please enter material costs, labour, and shipping information above to see pricing suggestions.
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-8">
              {markupBands.map((markup) => {
                const pricing = calculatePricingForMarkup(markup);
                const isRecommended = markup === 50;

                return (
                  <div
                    key={markup}
                    className={`border rounded-lg p-3 sm:p-6 ${
                      isRecommended ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{markup}% Markup</h3>
                      {isRecommended && (
                        <span className="px-2 sm:px-3 py-1 bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="mb-3 sm:mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Cost breakdown (net):</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Total materials cost:</span>
                          <span className="text-gray-900">{formatCurrency(totalMaterialsCostNet)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Labour cost:</span>
                          <span className="text-gray-900">{formatCurrency(labourCostPerUnitNet)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Overhead cost:</span>
                          <span className="text-gray-900">{formatCurrency(overheadCostPerUnitNet)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Actual shipping cost:</span>
                          <span className="text-gray-900">{formatCurrency(actualShippingCostNet)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Shipping overhead amount:</span>
                          <span className="text-gray-900">{formatCurrency(shippingOverheadAmount)}</span>
                        </div>
                        <div className="flex justify-between gap-2 pt-2 border-t border-gray-300">
                          <span className="font-semibold text-gray-900">Base cost per unit:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(baseCostPerUnitNet)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Suggestions */}
                    <div className="mb-3 sm:mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Price suggestions:</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Net item price (ex VAT):</span>
                          <span className="text-gray-900">{formatCurrency(pricing.netItemPrice)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-900">Gross item price (inc VAT) - calculated:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(pricing.grossItemPrice)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-blue-600">Gross item price (inc VAT) - rounded to .95:</span>
                          <span className="font-bold text-blue-600">{formatCurrency(pricing.roundedGrossPrice)}</span>
                        </div>
                        <div className="flex justify-between gap-2 pt-2">
                          <span className="text-gray-700">Suggested shipping charge (net):</span>
                          <span className="text-gray-900">{formatCurrency(suggestedShippingChargeNet)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Suggested shipping charge (gross inc VAT):</span>
                          <span className="text-gray-900">{formatCurrency(suggestedShippingChargeGross)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Marketplace Impact */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Marketplace impact:</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Estimated marketplace fees:</span>
                          <span className="text-gray-900">{formatCurrency(pricing.marketplaceFees)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Effective margin % after costs and fees:</span>
                          <span className="text-gray-900">{formatPercentage(pricing.effectiveMargin)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-900">Profit per unit (net):</span>
                          <span className={`font-semibold ${pricing.profitNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pricing.profitNet)}
                          </span>
                        </div>
                        {labourTimeMinutes > 0 && (
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-gray-900">Profit per hour (net):</span>
                            <span className={`font-semibold ${pricing.profitPerHour > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(pricing.profitPerHour)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
