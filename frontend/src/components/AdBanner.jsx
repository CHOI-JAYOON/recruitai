import { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-9563760248498524';

export default function AdBanner({ adSlot = '0000000000', adFormat = 'auto', className = '' }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등으로 실패 시 무시
    }
  }, []);

  return (
    <div className={`w-full max-w-xl mx-auto mt-4 ${className}`}>
      <p className="text-[10px] text-gray-300 text-center mb-1">광고</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-3 overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
