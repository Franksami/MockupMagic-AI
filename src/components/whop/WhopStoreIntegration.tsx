"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Zap, TrendingUp, DollarSign,
  ShoppingBag, Users, Eye, Target, CheckCircle,
  AlertCircle, RefreshCw, Upload, Download
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiquidGlassContainer, LiquidGlassCard } from "@/components/ui/LiquidGlassContainer";
import { useWhop } from "@/components/providers/whop-provider";
import { cn } from "@/lib/utils";

interface WhopStoreIntegrationProps {
  mockupId?: string;
  templateId?: string;
  className?: string;
}

interface WhopProduct {
  id: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  category: string;
  visibility: 'public' | 'private';
  createdAt: string;
}

export function WhopStoreIntegration({
  mockupId,
  templateId,
  className = ""
}: WhopStoreIntegrationProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationResults, setApplicationResults] = useState<Record<string, 'success' | 'error' | 'pending'>>({});
  const [whopProducts, setWhopProducts] = useState<WhopProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const { whopUser, isAuthenticated } = useWhop();

  // Get user's Whop store analytics
  const storeAnalytics = useQuery(
    api.whopAnalytics.getUserStoreAnalytics,
    isAuthenticated && whopUser ? { whopUserId: whopUser.id, limit: 10 } : "skip"
  );

  // Apply mockup to Whop store mutation
  const applyMockupToStore = useMutation(api.whopIntegration.applyMockupToStore);

  // Fetch user's Whop products
  useEffect(() => {
    if (!isAuthenticated || !whopUser) return;

    const fetchWhopProducts = async () => {
      try {
        setIsLoadingProducts(true);

        // This would call Whop API to get user's products
        // For now, using mock data that follows Whop structure
        const mockProducts: WhopProduct[] = [
          {
            id: "prod_1",
            title: "Premium Design Course",
            description: "Complete course on modern design principles",
            price: { amount: 99, currency: "USD" },
            category: "courses",
            visibility: "public",
            createdAt: "2024-01-15"
          },
          {
            id: "prod_2",
            title: "Exclusive Community Access",
            description: "Join our designer community",
            price: { amount: 29, currency: "USD" },
            category: "communities",
            visibility: "public",
            createdAt: "2024-02-01"
          }
        ];

        setWhopProducts(mockProducts);
      } catch (error) {
        console.error('Failed to fetch Whop products:', error);
        setWhopProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchWhopProducts();
  }, [isAuthenticated, whopUser]);

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleApplyMockups = async () => {
    if (!whopUser || selectedProducts.length === 0) return;

    setIsApplying(true);
    const results: Record<string, 'success' | 'error' | 'pending'> = {};

    // Initialize all as pending
    selectedProducts.forEach(productId => {
      results[productId] = 'pending';
    });
    setApplicationResults({ ...results });

    // Apply mockups to each selected product
    for (const productId of selectedProducts) {
      try {
        await applyMockupToStore({
          whopUserId: whopUser.id,
          whopProductId: productId,
          mockupId: mockupId || undefined,
          templateId: templateId || undefined,
        });

        results[productId] = 'success';
        setApplicationResults({ ...results });
      } catch (error) {
        console.error(`Failed to apply mockup to product ${productId}:`, error);
        results[productId] = 'error';
        setApplicationResults({ ...results });
      }
    }

    setIsApplying(false);
  };

  if (!isAuthenticated) {
    return (
      <LiquidGlassContainer className={cn("p-6 text-center", className)}>
        <div className="space-y-4">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Whop Store Integration</h3>
          <p className="text-gray-400">
            Connect your Whop account to apply mockups directly to your store products
          </p>
        </div>
      </LiquidGlassContainer>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <LiquidGlassContainer className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Apply to Your Whop Store
            </h2>
            <p className="text-gray-300">
              Transform your product visuals and boost conversions instantly
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">+45%</div>
            <div className="text-sm text-gray-400">Avg Conversion Boost</div>
          </div>
        </div>
      </LiquidGlassContainer>

      {/* Store Analytics Overview */}
      {storeAnalytics && storeAnalytics.length > 0 && (
        <LiquidGlassContainer className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Your Store Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {storeAnalytics.slice(0, 3).map((analytics: any) => (
              <div key={analytics._id} className="text-center">
                <div className="text-xl font-bold text-white">
                  {analytics.metric === 'conversion_rate' && `${analytics.afterValue.toFixed(1)}%`}
                  {analytics.metric === 'page_views' && analytics.afterValue.toLocaleString()}
                  {analytics.metric === 'sales' && `$${analytics.afterValue.toLocaleString()}`}
                </div>
                <div className="text-sm text-gray-400 capitalize">
                  {analytics.metric.replace('_', ' ')}
                </div>
                <div className="text-xs text-green-400">
                  +{analytics.improvementPercent.toFixed(1)}% improvement
                </div>
              </div>
            ))}
          </div>
        </LiquidGlassContainer>
      )}

      {/* Product Selection */}
      <LiquidGlassContainer className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-400" />
            Select Products to Update
          </h3>
          <button
            onClick={() => setIsLoadingProducts(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoadingProducts ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : whopProducts.length > 0 ? (
          <div className="space-y-3">
            {whopProducts.map((product) => (
              <motion.button
                key={product.id}
                onClick={() => handleProductSelect(product.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedProducts.includes(product.id)
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{product.title}</h4>
                        <p className="text-sm text-gray-400 line-clamp-1">{product.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-green-400">
                            ${product.price.amount} {product.price.currency}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {product.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.visibility}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Status */}
                  <div className="ml-4">
                    {applicationResults[product.id] === 'pending' && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Applying...</span>
                      </div>
                    )}
                    {applicationResults[product.id] === 'success' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Applied</span>
                      </div>
                    )}
                    {applicationResults[product.id] === 'error' && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Failed</span>
                      </div>
                    )}
                    {!applicationResults[product.id] && selectedProducts.includes(product.id) && (
                      <div className="w-5 h-5 border-2 border-primary-500 rounded"></div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No Whop products found</p>
            <p className="text-sm text-gray-500 mt-2">
              Create products in your Whop dashboard first
            </p>
          </div>
        )}

        {/* Apply Button */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-white">
                  Ready to Apply Mockup
                </h4>
                <p className="text-sm text-gray-400">
                  {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} selected
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-400">Expected: +45% conversion</div>
                <div className="text-xs text-gray-400">Based on community data</div>
              </div>
            </div>

            <button
              onClick={handleApplyMockups}
              disabled={isApplying}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Applying Mockups...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Apply to Selected Products
                </>
              )}
            </button>
          </motion.div>
        )}
      </LiquidGlassContainer>

      {/* ROI Prediction */}
      {selectedProducts.length > 0 && (
        <LiquidGlassContainer className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Expected ROI Impact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before/After Visualization */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">Conversion Rate Projection</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Average:</span>
                  <span className="text-white">2.3%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gray-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">With Mockups:</span>
                  <span className="text-green-400 font-medium">3.3% (+45%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                </div>
              </div>
            </div>

            {/* Revenue Impact */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">Revenue Impact</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Monthly:</span>
                  <span className="text-white">$2,340</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Projected Monthly:</span>
                  <span className="text-green-400 font-medium">$3,393</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-white font-medium">Additional Revenue:</span>
                  <span className="text-green-400 font-bold">+$1,053/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-medium text-white mb-3">Success Stories from Community</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <span className="text-sm text-green-300">@markusdesign</span>
                </div>
                <p className="text-sm text-green-200">
                  "Increased my course sales by 67% in just 2 weeks with MockupMagic templates!"
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-sm text-blue-300">@sarahcreates</span>
                </div>
                <p className="text-sm text-blue-200">
                  "My community membership conversions went from 3% to 5.2%. Amazing results!"
                </p>
              </div>
            </div>
          </div>
        </LiquidGlassContainer>
      )}

      {/* Application Results */}
      {Object.keys(applicationResults).length > 0 && (
        <LiquidGlassContainer className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Application Results</h3>
          <div className="space-y-3">
            {selectedProducts.map(productId => {
              const product = whopProducts.find(p => p.id === productId);
              const status = applicationResults[productId];

              return (
                <div key={productId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <span className="text-white font-medium">{product?.title}</span>
                    <div className="text-sm text-gray-400">{product?.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'pending' && (
                      <>
                        <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                        <span className="text-yellow-400 text-sm">Applying...</span>
                      </>
                    )}
                    {status === 'success' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">Applied successfully</span>
                      </>
                    )}
                    {status === 'error' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm">Application failed</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </LiquidGlassContainer>
      )}
    </div>
  );
}