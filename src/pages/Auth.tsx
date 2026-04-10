import AuthLegacy from './AuthLegacy';
import AuthMaintenance from './AuthMaintenance';

// Temporary maintenance gate: set VITE_AUTH_MAINTENANCE_MODE=false to restore the original auth flow.
const isAuthMaintenanceMode = import.meta.env.VITE_AUTH_MAINTENANCE_MODE !== 'false';

const Auth = () => {
  return isAuthMaintenanceMode ? <AuthMaintenance /> : <AuthLegacy />;
};

export default Auth;
