import { useState } from "react";
import type { LinkedInProfile } from "./types";
import { useStoredProfiles } from "./hooks/useStoredProfiles";
import { ProfileCard } from "./components/ProfileCard";
import { ProfileDetailModal } from "./components/ProfileDetailModal";

type TabType = "scrape" | "saved" | "search";

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>("scrape");
  const [scrapedData, setScrapedData] = useState<LinkedInProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] =
    useState<LinkedInProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    profiles,
    loading: profilesLoading,
    error: profilesError,
    saveProfile,
    checkIfProfileExists,
  } = useStoredProfiles();

  const isLinkedInPage = (url: string) => {
    return (
      url.includes("linkedin.com/in/") || url.includes("linkedin.com/company/")
    );
  };

  const handleScrape = async () => {
    setError(null);
    setScrapedData(null);
    setLoading(true);

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || !tab?.url) {
      setError("Unable to access current tab.");
      setLoading(false);
      return;
    }

    if (!isLinkedInPage(tab.url)) {
      setError("Please open a LinkedIn profile or company page.");
      setLoading(false);
      return;
    }

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

          for (let i = 0; i < 2; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await sleep(1000);
          }

          const clean = (text?: string | null) =>
            text?.replace(/\s+/g, " ").trim() || null;

          const getText = (selector: string) =>
            clean(document.querySelector(selector)?.textContent);

          const name = getText("h1");
          const headline = getText(".text-body-medium");
          const location = getText(".text-body-small.inline");

          let about: string | null = null;

          const aboutSelectors = [
            () => {
              const aboutSection = document.querySelector(
                "[data-generated-suggestion-target]"
              );
              if (aboutSection && aboutSection.textContent?.includes("About")) {
                const contentDiv = aboutSection.querySelector(
                  ".inline-show-more-text"
                );
                return contentDiv?.textContent?.trim() || null;
              }
              return null;
            },

            () => {
              const aboutDivs = document.querySelectorAll(
                ".pv-shared-text-with-see-more"
              );
              for (const div of aboutDivs) {
                const text = div.textContent?.trim();
                if (text && text.length > 50 && !text.includes("About")) {
                  return text;
                }
              }
              return null;
            },

            () => {
              const aboutAnchor = document.querySelector("#about");
              if (aboutAnchor) {
                const section = aboutAnchor.closest("section");
                if (section) {
                  const textContainers = section.querySelectorAll(
                    'span[aria-hidden="true"], .inline-show-more-text, .pv-shared-text-with-see-more'
                  );
                  for (const container of textContainers) {
                    const text = container.textContent?.trim();
                    if (text && text.length > 50 && !text.includes("About")) {
                      return text.replace(/\n{3,}/g, "\n\n");
                    }
                  }
                }
              }
              return null;
            },

            () => {
              const allSpans = document.querySelectorAll(
                'span[aria-hidden="true"]'
              );
              for (const span of allSpans) {
                const text = span.textContent?.trim();
                if (text && text.length > 100) {
                  const parent = span.closest("section");
                  if (parent) {
                    const sectionText = parent.textContent || "";
                    if (
                      sectionText.includes("About") ||
                      sectionText.includes("summary")
                    ) {
                      return text.replace(/\n{3,}/g, "\n\n");
                    }
                  }
                }
              }
              return null;
            },
          ];

          for (const method of aboutSelectors) {
            try {
              const content = method();
              if (content && content.length > 20) {
                about = content;
                break;
              }
            } catch (err) {
              console.log(err);
            }
          }

          return {
            name,
            headline,
            location,
            about,
            profileUrl: window.location.href,
          };
        },
      });

      const scrapedProfile = result[0].result as LinkedInProfile;
      setScrapedData(scrapedProfile);

      const existingProfile = await checkIfProfileExists(
        scrapedProfile.profileUrl
      );
      if (existingProfile) {
        setError("This profile has already been saved.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to scrape page.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!scrapedData) return;

    try {
      await saveProfile(scrapedData);
      setError(null);
      setScrapedData(null);
      setCurrentTab("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  };

  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-96 h-[600px] bg-white flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h1 className="text-xl font-bold mb-1">LinkedIn Scraper Pro</h1>
        <p className="text-xs opacity-90">
          Extract and manage LinkedIn profiles
        </p>
      </div>

      <div className="flex border-b border-gray-200">
        {(["scrape", "saved", "search"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              currentTab === tab
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {currentTab === "scrape" && (
          <div className="p-4 h-full flex flex-col">
            <button
              onClick={handleScrape}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed mb-4"
            >
              {loading ? "Scraping..." : "Scrape Current Page"}
            </button>

            <div className="flex-1 overflow-auto space-y-4">
              {error && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Scraping profile data...
                  </p>
                </div>
              )}

              {!loading && !scrapedData && !error && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Open a LinkedIn profile and click "Scrape Current Page"
                  </p>
                </div>
              )}

              {scrapedData && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm">
                    Profile successfully scraped!
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Name
                      </div>
                      <div className="font-medium text-gray-900">
                        {scrapedData.name || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Headline
                      </div>
                      <div className="text-gray-700">
                        {scrapedData.headline || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Location
                      </div>
                      <div className="text-gray-700">
                        {scrapedData.location || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        About
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {scrapedData.about || "About section not found."}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save to Database
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === "saved" && (
          <div className="p-4 h-full flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Saved Profiles
              </h2>
              <p className="text-sm text-gray-600">
                {profiles.length} profiles saved
              </p>
            </div>

            <div className="flex-1 overflow-auto">
              {profilesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : profilesError ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                  {profilesError}
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">No saved profiles yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start scraping to build your collection
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onView={setSelectedProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === "search" && (
          <div className="p-4 h-full flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, headline, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-auto">
              {searchQuery && filteredProfiles.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    No profiles found matching "{searchQuery}"
                  </p>
                </div>
              )}

              {searchQuery && filteredProfiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Found {filteredProfiles.length} profile
                    {filteredProfiles.length !== 1 ? "s" : ""}
                  </p>
                  {filteredProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onView={setSelectedProfile}
                    />
                  ))}
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Enter a search query to find profiles
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ProfileDetailModal
        profile={selectedProfile}
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </div>
  );
}
