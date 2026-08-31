import { useMemo } from 'react';

export const useUserInitials = (name: string): string => {
  return useMemo(() => {
    const formattedName = name.trim();

    if (!formattedName) {
      return '';
    }

    const parts = formattedName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    const firstNameInitial = parts[0].charAt(0).toUpperCase();
    const lastNameInitial = parts[parts.length - 1].charAt(0).toUpperCase();

    return `${firstNameInitial}${lastNameInitial}`;
  }, [name]);
};
