import { SetMetadata } from '@nestjs/common';

export const SUPERADMIN_KEY = 'isSuperAdmin';
export const SuperAdmin = () => SetMetadata(SUPERADMIN_KEY, true);

