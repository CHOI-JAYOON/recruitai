import LoadingSpinner from './LoadingSpinner';
import AdBanner from './AdBanner';

export default function LoadingWithAd({ text, adSlot }) {
  return (
    <div className="flex flex-col items-center">
      <LoadingSpinner text={text} />
      <AdBanner adSlot={adSlot} />
    </div>
  );
}
