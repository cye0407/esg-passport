import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  hasActiveLicense,
  validateLicenseKey,
  storeLicense,
  revalidateStoredLicense,
} from '@/lib/license';

const LicenseContext = createContext({
  isPaid: false,
  isChecking: true,
  activate: async () => ({ valid: false, error: '' }),
});

export function useLicense() {
  return useContext(LicenseContext);
}

/**
 * Provides license status to the entire app.
 * Free users pass through — no blocking. License status determines
 * which features are available (data tracking = free, response generator = paid).
 */
export function LicenseProvider({ children }) {
  const [isPaid, setIsPaid] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkLicense();
  }, []);

  async function checkLicense() {
    if (!hasActiveLicense()) {
      setIsPaid(false);
      setIsChecking(false);
      return;
    }

    // Has a stored key — re-validate in background
    const valid = await revalidateStoredLicense();
    setIsPaid(valid);
    setIsChecking(false);
  }

  const activate = useCallback(async (key) => {
    const result = await validateLicenseKey(key);
    if (result.valid) {
      storeLicense(key, result.instance_id);
      setIsPaid(true);
    }
    return result;
  }, []);

  return (
    <LicenseContext.Provider value={{ isPaid, isChecking, activate }}>
      {children}
    </LicenseContext.Provider>
  );
}
