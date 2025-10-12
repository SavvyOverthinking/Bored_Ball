/**
 * Feature Flags Configuration
 * Controls which version features are enabled
 */

export const FLAGS = {
  PHASE2: import.meta.env.VITE_PHASE2 === '1'
};

export default FLAGS;

