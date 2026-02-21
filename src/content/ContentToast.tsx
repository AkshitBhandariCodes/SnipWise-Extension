import React from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
  contentType?: string;
  icon?: string;
  image?: string;
  preview?: string;
}

const typeConfig: Record<string, { icon: string; gradient: string }> = {
  url:   { icon: '🔗', gradient: 'linear-gradient(135deg, #60A5FA, #3B82F6)' },
  code:  { icon: '{ }', gradient: 'linear-gradient(135deg, #A78BFA, #8B5CF6)' },
  color: { icon: '🎨', gradient: 'linear-gradient(135deg, #F472B6, #EC4899)' },
  text:  { icon: '📝', gradient: 'linear-gradient(135deg, #94A3B8, #64748B)' },
  image: { icon: '🖼️', gradient: 'linear-gradient(135deg, #F472B6, #EC4899)' },
};

export default function ContentToast({ message, type, contentType, icon, image, preview }: Props) {
  const config = typeConfig[contentType || 'text'] || typeConfig.text;
  const displayIcon = icon || config.icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        background: '#111111',
        color: 'white',
        borderRadius: '14px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.2)',
        border: '1.5px solid rgba(139, 92, 246, 0.35)',
        pointerEvents: 'auto' as const,
        animation: 'snipwise-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '340px',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          flexShrink: 0,
          background: image ? 'transparent' : config.gradient,
          overflow: 'hidden',
        }}
      >
        {image ? (
          <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{displayIcon}</span>
        )}
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' as const }}>
          {message || 'Successfully added to Snipwise ✨'}
        </span>
        {preview && (
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.55)',
              maxWidth: '220px',
              whiteSpace: 'nowrap' as const,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {preview}
          </span>
        )}
      </div>
    </div>
  );
}
