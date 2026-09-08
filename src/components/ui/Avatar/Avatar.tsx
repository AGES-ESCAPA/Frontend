import type { FC } from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  name: string;
  avatarUrl?: string;
  theme?: 'dark';
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const Avatar: FC<AvatarProps> = ({ name, avatarUrl, theme = 'dark' }) => {
  return (
    <span className={`${styles.avatar} ${styles[theme]}`} aria-label={name}>
      {avatarUrl ? <img src={avatarUrl} alt="" /> : getInitials(name)}
    </span>
  );
};
