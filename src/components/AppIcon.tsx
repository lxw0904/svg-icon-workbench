import type { SVGProps } from 'react';

export type AppIconName =
  | 'alert'
  | 'check'
  | 'chevron'
  | 'close'
  | 'code'
  | 'copy'
  | 'download'
  | 'eye'
  | 'file'
  | 'grid'
  | 'moon'
  | 'search'
  | 'sun'
  | 'trash'
  | 'upload';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: AppIconName;
  size?: number;
}

export function AppIcon({ name, size = 18, ...props }: AppIconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {name === 'upload' && (
        <>
          <path {...common} d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
          <path {...common} d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
        </>
      )}
      {name === 'search' && (
        <>
          <circle {...common} cx="10.5" cy="10.5" r="6.5" />
          <path {...common} d="m15.5 15.5 4 4" />
        </>
      )}
      {name === 'trash' && (
        <>
          <path {...common} d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
        </>
      )}
      {name === 'alert' && (
        <>
          <path {...common} d="M10.3 4.4 2.7 17.6A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.4L13.7 4.4a2 2 0 0 0-3.4 0Z" />
          <path {...common} d="M12 9v4m0 3h.01" />
        </>
      )}
      {name === 'check' && <path {...common} d="m5 12 4.2 4.2L19 6.5" />}
      {name === 'close' && <path {...common} d="m6 6 12 12M18 6 6 18" />}
      {name === 'code' && <path {...common} d="m8 5-5 7 5 7m8-14 5 7-5 7m-2-17-4 20" />}
      {name === 'copy' && (
        <>
          <rect {...common} x="8" y="8" width="11" height="12" rx="2" />
          <path {...common} d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
        </>
      )}
      {name === 'download' && (
        <>
          <path {...common} d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path {...common} d="M4 19h16" />
        </>
      )}
      {name === 'eye' && (
        <>
          <path {...common} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle {...common} cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === 'file' && (
        <>
          <path {...common} d="M6 3h8l4 4v14H6z" />
          <path {...common} d="M14 3v5h5M9 13h6m-6 4h6" />
        </>
      )}
      {name === 'grid' && (
        <>
          <rect {...common} x="3" y="3" width="7" height="7" rx="1.5" />
          <rect {...common} x="14" y="3" width="7" height="7" rx="1.5" />
          <rect {...common} x="3" y="14" width="7" height="7" rx="1.5" />
          <rect {...common} x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )}
      {name === 'sun' && (
        <>
          <circle {...common} cx="12" cy="12" r="4" />
          <path {...common} d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
      {name === 'moon' && <path {...common} d="M20 15.2A8 8 0 0 1 8.8 4 8 8 0 1 0 20 15.2Z" />}
      {name === 'chevron' && <path {...common} d="m8 10 4 4 4-4" />}
    </svg>
  );
}
