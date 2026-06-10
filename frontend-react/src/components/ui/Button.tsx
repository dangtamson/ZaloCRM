import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Button({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={twMerge('inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700', className)}
      type={type}
      {...props}
    />
  );
}
