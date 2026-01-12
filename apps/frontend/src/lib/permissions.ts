export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
}

export const hasRole = (userRole: string | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false
  
  if (requiredRole === UserRole.SUPERADMIN) {
    return userRole === UserRole.SUPERADMIN
  }
  
  return userRole === requiredRole
}

export const isSuperAdmin = (userRole: string | undefined): boolean => {
  return userRole === UserRole.SUPERADMIN
}

export const isAdmin = (userRole: string | undefined): boolean => {
  return userRole === UserRole.ADMIN
}

