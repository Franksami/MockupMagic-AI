/**
 * Whop iframe SDK wrapper for secure iframe communication
 * Follows Whop's official SDK patterns from documentation
 */

// This is the object returned from whopSdk.payments.chargeUser()
interface WhopInAppPurchase {
  id: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional Whop properties
}

// Legacy interface for backward compatibility
interface InAppPurchaseOptions {
  planId: string;
  metadata?: Record<string, any>;
}

interface InAppPurchaseResult {
  status: "ok" | "error" | "cancelled";
  data?: {
    receipt_id: string;
    payment_intent_id?: string;
  };
  error?: string;
}

interface IframeSdk {
  // Updated to accept either the Whop inAppPurchase object OR legacy options
  inAppPurchase(purchaseData: WhopInAppPurchase | InAppPurchaseOptions): Promise<InAppPurchaseResult>;
}

/**
 * Initialize Whop iframe SDK
 * Supports both new Whop inAppPurchase objects and legacy planId format
 */
function initializeIframeSdk(): IframeSdk {
  return {
    async inAppPurchase(purchaseData: WhopInAppPurchase | InAppPurchaseOptions): Promise<InAppPurchaseResult> {
      try {
        // Check if we're in iframe environment
        if (!window.parent || window.parent === window) {
          throw new Error("Not running in iframe environment");
        }

        // Determine if this is the new format (from chargeUser) or legacy format
        const isWhopInAppPurchase = 'id' in purchaseData && 'amount' in purchaseData;

        // Post message to parent frame (Whop)
        const requestId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("Purchase request timed out"));
          }, 30000); // 30 second timeout

          const messageHandler = (event: MessageEvent) => {
            // Validate origin for security
            if (!event.origin.includes('whop.com')) {
              return;
            }

            if (event.data?.requestId === requestId) {
              cleanup();
              resolve(event.data.result);
            }
          };

          const cleanup = () => {
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageHandler);
          };

          window.addEventListener('message', messageHandler);

          // Send purchase request to parent with appropriate format
          if (isWhopInAppPurchase) {
            // New format: Send the inAppPurchase object directly
            window.parent.postMessage({
              type: 'WHOP_IN_APP_PURCHASE',
              requestId,
              payload: purchaseData // Send the entire inAppPurchase object
            }, '*');
          } else {
            // Legacy format: Send planId and metadata
            const legacyOptions = purchaseData as InAppPurchaseOptions;
            window.parent.postMessage({
              type: 'WHOP_IN_APP_PURCHASE',
              requestId,
              payload: {
                planId: legacyOptions.planId,
                metadata: legacyOptions.metadata || {}
              }
            }, '*');
          }
        });

      } catch (error) {
        console.error("Iframe SDK error:", error);
        return {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error occurred"
        };
      }
    }
  };
}

// Export singleton instance
export const iframeSdk: IframeSdk = initializeIframeSdk();

// Fallback for development/testing
if (process.env.NODE_ENV === 'development') {
  // Override with mock implementation for development
  (iframeSdk as any).inAppPurchase = async (purchaseData: WhopInAppPurchase | InAppPurchaseOptions): Promise<InAppPurchaseResult> => {
    console.log("Mock purchase:", purchaseData);

    // Check if it's the new inAppPurchase format or legacy format
    const isWhopInAppPurchase = 'id' in purchaseData && 'amount' in purchaseData;

    if (isWhopInAppPurchase) {
      console.log("Using new Whop inAppPurchase format in dev mode");
    } else {
      console.log("Using legacy planId format in dev mode");
    }

    // Simulate purchase flow in development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: "ok",
          data: {
            receipt_id: `mock_receipt_${Date.now()}`,
            payment_intent_id: `mock_pi_${Date.now()}`
          }
        });
      }, 2000); // Simulate 2 second processing
    });
  };
}

// Export types for use in other files
export type { WhopInAppPurchase, InAppPurchaseOptions, InAppPurchaseResult };