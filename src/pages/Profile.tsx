import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, Clock, Award, MapPin, Globe, Linkedin, Github, Twitter, Edit2, X, Check, Camera } from 'lucide-react';
import { format } from 'date-fns';
import ImageUpload from '../components/ImageUpload';

interface UserProfile {
  full_name: string;
  avatar_url: string;
  role: string;
  headline: string;
  bio: string;
  location: string;
  website: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  badges?: {
    badge: {
      id: string;
      name: string;
      description: string;
      image_url: string;
    };
    awarded_at: string;
  }[];
}

interface EnrolledCourse {
  course: {
    id: string;
    title: string;
    description: string;
    duration: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    thumbnail_url: string;
    category: string;
  };
  progress: number;
  enrolled_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfileAndCourses() {
      if (!user) return;

      try {
        // Fetch profile with badges
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            badges:user_badges(
              awarded_at,
              badge:badge_id(
                id,
                name,
                description,
                image_url
              )
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          setProfile(profileData);
          setEditedProfile(profileData);
        }

        // Fetch enrolled courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_enrollments')
          .select(`
            progress,
            enrolled_at,
            course:course_id (
              id,
              title,
              description,
              duration,
              level,
              thumbnail_url,
              category
            )
          `)
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false });

        if (coursesError) {
          console.error('Error fetching enrolled courses:', coursesError);
        } else {
          setEnrolledCourses(coursesData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndCourses();
  }, [user]);

  const handleSave = async () => {
    if (!user || !editedProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedProfile)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    if (editedProfile) {
      setEditedProfile({ ...editedProfile, avatar_url: url });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return <div>Error loading profile</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800"></div>
        <div className="relative px-6 pb-6">
          <div className="flex justify-between items-start">
            <div className="relative group">
              <img
                src={editing ? editedProfile.avatar_url || 'https://via.placeholder.com/150' : profile.avatar_url || 'https://via.placeholder.com/150'}
                alt={profile.full_name}
                className="w-32 h-32 rounded-full border-4 border-white -mt-16 object-cover"
              />
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-black bg-opacity-50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageUpload onUploadComplete={handleImageUpload}>
                      <Camera className="w-8 h-8 text-white" />
                    </ImageUpload>
                  </div>
                </div>
              )}
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="mt-4 flex items-center text-gray-600 hover:text-gray-800"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={editedProfile.full_name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Headline</label>
                <input
                  type="text"
                  value={editedProfile.headline || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, headline: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Software Developer, Tech Enthusiast, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={editedProfile.location || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={editedProfile.website || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                <input
                  type="url"
                  value={editedProfile.linkedin_url || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, linkedin_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
                <input
                  type="url"
                  value={editedProfile.github_url || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, github_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Twitter URL</label>
                <input
                  type="url"
                  value={editedProfile.twitter_url || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, twitter_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://twitter.com/username"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedProfile(profile);
                  }}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              {profile.headline && (
                <p className="text-gray-600 mt-1">{profile.headline}</p>
              )}
              {profile.location && (
                <p className="flex items-center text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profile.location}
                </p>
              )}
              {profile.bio && (
                <p className="text-gray-700 mt-4">{profile.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-4">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Badges Section */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Badges</h3>
              <div className="flex flex-wrap gap-4">
                {profile.badges.map(({ badge, awarded_at }) => (
                  <div
                    key={badge.id}
                    className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm"
                    title={`Awarded on ${format(new Date(awarded_at), 'PP')}`}
                  >
                    {badge.image_url ? (
                      <img
                        src={badge.image_url}
                        alt={badge.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <Award className="w-8 h-8 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-gray-500">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Courses Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Learning</h2>
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
            <Link
              to="/courses"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {enrolledCourses.map(({ course, progress, enrolled_at }) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">{course.category}</span>
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                      ${course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${course.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {course.level}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Enrolled on {format(new Date(enrolled_at), 'MMM d, yyyy')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.duration} mins
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {progress}% complete
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
