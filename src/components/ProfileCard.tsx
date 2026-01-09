import { useState } from 'react';
import type { LinkedInProfile } from '../types';

interface ProfileCardProps {
  profile: LinkedInProfile;
  onView: (profile: LinkedInProfile) => void;
  onDelete?: (profile: LinkedInProfile) => void;
}

export const ProfileCard = ({ profile, onView, onDelete }: ProfileCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (onDelete && !isDeleting) {
      setIsDeleting(true);
      try {
        await onDelete(profile);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">
          {profile.name || 'Unknown Name'}
        </h3>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {isDeleting ? '...' : '×'}
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
        {profile.headline || 'No headline available'}
      </p>
      
      <p className="text-xs text-gray-500 mb-3">
        {profile.location || 'Location not specified'}
      </p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {new Date(profile.scrapedAt || profile.createdAt || '').toLocaleDateString()}
        </span>
        <button
          onClick={() => onView(profile)}
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
