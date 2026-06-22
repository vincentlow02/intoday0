import React, { useState } from 'react';
import { getTaskCardPresentation, normalizeCardType, CARD_TYPES } from '../taskCardUtils';
import { getPackItemSourceMeta } from '../lib/packItemUtils';

const PackItemSourceIcon = ({ task, appearance, labels }) => {
  const [imgError, setImgError] = useState(false);
  const { cfg } = getTaskCardPresentation(task, labels || {});
  const { sourceKey, domain } = getPackItemSourceMeta(task, labels || {});
  const iconBackground = appearance === 'dark' ? cfg.darkBg : cfg.bg;
  const iconBorder = appearance === 'dark' ? `1px solid ${cfg.darkStroke}` : 'none';
  const photoPreview = task?.photoDataUrl || task?.photoUrl;

  if (normalizeCardType(task?.cardType) === CARD_TYPES.PHOTO && photoPreview) {
    return (
      <span className="desktop-pack-page-item-leading desktop-pack-page-item-leading-photo-preview" aria-hidden="true">
        <img
          src={photoPreview}
          alt=""
          width={36}
          height={36}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
        />
      </span>
    );
  }

  if (domain && !imgError) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return (
      <span className="desktop-pack-page-item-leading desktop-pack-page-item-leading-favicon" aria-hidden="true">
        <img
          src={faviconUrl}
          alt=""
          width={22}
          height={22}
          style={{ borderRadius: 4, objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`desktop-pack-page-item-leading desktop-pack-page-item-leading-${sourceKey || 'link'}`}
      aria-hidden="true"
      style={{ background: iconBackground, border: iconBorder }}
    >
      {appearance === 'dark' && cfg.darkIconColor ? (
        <span
          style={{
            width: 18,
            height: 18,
            backgroundColor: cfg.darkIconColor,
            maskImage: `url(${cfg.icon})`,
            WebkitMaskImage: `url(${cfg.icon})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      ) : (
        <img src={cfg.icon} alt="" width={18} height={18} style={{ objectFit: 'contain' }} />
      )}
    </span>
  );
};

export default PackItemSourceIcon;
