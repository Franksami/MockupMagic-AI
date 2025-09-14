"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check, AlertCircle } from "lucide-react";
import { LiquidGlassContainer } from "@/components/ui/LiquidGlassContainer";
import { purchaseCredits, CREDIT_PACKS, CreditPackSize, getPackPriceDisplay } from "@/lib/credit-purchases";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (creditAmount: number, receiptId: string) => void;
  className?: string;
}

export function CreditPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  className = ""
}: CreditPurchaseModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPackSize>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseState, setPurchaseState] = useState<'selecting' | 'processing' | 'success' | 'error'>('selecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ creditAmount: number; receiptId: string } | null>(null);

  const handlePurchase = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setPurchaseState('processing');
    setErrorMessage('');

    try {
      const result = await purchaseCredits(selectedPack);

      if (result.success && result.receiptId && result.creditAmount) {
        setPurchaseState('success');
        setSuccessData({
          creditAmount: result.creditAmount,
          receiptId: result.receiptId
        });
        onSuccess?.(result.creditAmount, result.receiptId);
      } else {
        setPurchaseState('error');
        setErrorMessage(result.error || 'Purchase failed. Please try again.');
      }
    } catch (error) {
      setPurchaseState('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;

    setPurchaseState('selecting');
    setErrorMessage('');
    setSuccessData(null);
    onClose();
  };

  const resetToSelection = () => {
    setPurchaseState('selecting');
    setErrorMessage('');
    setSuccessData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <LiquidGlassContainer className={`p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Zap className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  {purchaseState === 'success' ? 'Purchase Complete!' : 'Purchase Credits'}
                </h2>
              </div>
              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {purchaseState === 'selecting' && (
                <motion.div
                  key="selecting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <p className="text-gray-300 mb-6">
                    Choose a credit pack to continue generating amazing mockups
                  </p>

                  {/* Credit Pack Options */}
                  <div className="space-y-3">
                    {Object.entries(CREDIT_PACKS).map(([key, pack]) => {
                      const packKey = key as CreditPackSize;
                      const isSelected = selectedPack === packKey;
                      const pricing = getPackPriceDisplay(packKey);

                      return (
                        <motion.button
                          key={key}
                          onClick={() => setSelectedPack(packKey)}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-semibold text-white">
                                  {pack.amount} Credits
                                </span>
                                {pack.popular && (
                                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                    Most Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{pack.description}</p>
                              <p className="text-xs text-gray-500">{pricing.perCredit}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-white">{pricing.price}</div>
                              {pricing.savings && (
                                <div className="text-sm text-green-400">{pricing.savings}</div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Purchase Button */}
                  <motion.button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-primary-600 hover:from-blue-700 hover:to-primary-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Purchase {CREDIT_PACKS[selectedPack].amount} Credits for ${CREDIT_PACKS[selectedPack].price}
                  </motion.button>
                </motion.div>
              )}

              {purchaseState === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Zap className="w-12 h-12 text-blue-400 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">Processing Purchase</h3>
                  <p className="text-gray-300">
                    Please complete the payment in the popup window...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    This usually takes 10-30 seconds
                  </p>
                </motion.div>
              )}

              {purchaseState === 'success' && successData && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">Purchase Successful!</h3>
                  <p className="text-gray-300 mb-4">
                    {successData.creditAmount} credits have been added to your account
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    Receipt ID: {successData.receiptId}
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                  >
                    Continue Creating
                  </button>
                </motion.div>
              )}

              {purchaseState === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center py-8"
                >
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Purchase Failed</h3>
                  <p className="text-red-300 mb-6">{errorMessage}</p>
                  <div className="space-y-3">
                    <button
                      onClick={resetToSelection}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LiquidGlassContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}