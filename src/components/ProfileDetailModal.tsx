import type { LinkedInProfile } from '../types';

interface ProfileDetailModalProps {
  profile: LinkedInProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDetailModal = ({ profile, isOpen, onClose }: ProfileDetailModalProps) => {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {profile.name || 'Unknown Name'}
            </h3>
            <p className="text-gray-600 mb-4">
              {profile.headline || 'No headline available'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
             {profile.location || 'Location not specified'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">About</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {profile.about || 'No about section available'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Profile Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Profile URL:</span>
                <a 
                  href={profile.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline truncate max-w-xs"
                >
                  View Profile
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scraped:</span>
                <span className="text-gray-700">
                  {new Date(profile.scrapedAt || profile.createdAt || '').toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
