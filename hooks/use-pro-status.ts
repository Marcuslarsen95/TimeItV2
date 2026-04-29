import { useUserPreferences } from "./use-user-preferences";

/**
 * Single source of truth for whether the user has Cria Pro.
 *
 * For now this is just a flag in user preferences (toggleable via the
 * Settings modal). Once RevenueCat is wired up, swap the body of this
 * hook to read `Purchases.getCustomerInfo()` / its entitlement; every
 * caller stays the same.
 */
export function useProStatus() {
  const { preferences, updatePreference } = useUserPreferences();
  const isPro = preferences.isPro ?? false;
  const setIsPro = (value: boolean) => updatePreference("isPro", value);
  return { isPro, setIsPro };
}
