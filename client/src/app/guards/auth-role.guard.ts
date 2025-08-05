import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';

const isAcessAllowed = async (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean> => {
  const { authenticated, grantedRoles, keycloak } = authData;
  const requiredRole = route.data['role'];

  if (!requiredRole) {
    return false;
  }

  const hasRequiredRole = (role: string): boolean =>
    Object.values(grantedRoles.resourceRoles).some((roles) =>
      roles.includes(role)
    );

  if (authenticated && hasRequiredRole(requiredRole)) {
    return true;
  }

  await keycloak.login();
  return false;
};

export const canActivateAuthRole =
  createAuthGuard<CanActivateFn>(isAcessAllowed);
