import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  authData: AuthGuardData,
): Promise<boolean> => {
  const { authenticated, grantedRoles, keycloak } = authData;
  const requiredRole = route.data['role'];

  if (!requiredRole) {
    return false;
  }

  if (!authenticated) {
    await keycloak.login({
      redirectUri: window.location.origin + window.location.pathname + '#' + state.url,
    });
    return false;
  }

  const hasRequiredRole = (role: string): boolean =>
    Object.values(grantedRoles.resourceRoles || {}).some((roles) => roles.includes(role));

  if (hasRequiredRole(requiredRole)) {
    return true;
  }

  return false;
};

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);
