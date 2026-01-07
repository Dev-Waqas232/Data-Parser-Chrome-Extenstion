import { useState } from "react";

type ParsedData = {
  title: string;
  url: string;
  headingText: string[];
  images: string[];
  paraText: string[];
};

export default function App() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    try {
      setLoading(true);

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) return;

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const title = document.title;
          const url = window.location.href;

          const headingText = Array.from(
            document.querySelectorAll("h1, h2, h3, h4, h5, h6")
          ).map((h) => h.textContent?.trim() || "");

          const images = Array.from(document.querySelectorAll("img")).map(
            (img) => img.src
          );

          const paraText = Array.from(document.querySelectorAll("p")).map(
            (p) => p.textContent?.trim() || ""
          );

          return {
            title,
            url,
            headingText,
            images,
            paraText,
          };
        },
      });

      setData(result[0].result as ParsedData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 h-[420px] bg-linear-to-br from-indigo-600 to-violet-600 p-3 text-white rounded-md flex flex-col gap-3">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold tracking-wide">Data Parser</h3>
        <p className="text-xs text-indigo-100">
          Extract data from the current page
        </p>
      </div>

      {/* Button */}
      <button
        onClick={handleParse}
        disabled={loading}
        className="w-full bg-white text-indigo-700 font-medium py-2 rounded-lg shadow-md hover:bg-indigo-50
          active:scale-[0.98] transition disabled:opacity-60"
      >
        {loading ? "Parsing..." : "Parse Page"}
      </button>

      {/* Results */}
      <div className="flex-1 overflow-auto rounded-md bg-white/10 p-2 text-xs space-y-2">
        {!data && <p className="opacity-70 text-center">No data yet...</p>}

        {data && (
          <>
            <div>
              <div className="font-semibold">Title</div>
              <div className="break-words">{data.title}</div>
            </div>

            <div>
              <div className="font-semibold">
                Headings ({data.headingText.length})
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {data.headingText.map((h, i) => (
                  <li key={i} className="break-words">
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-semibold">Images ({data.images.length})</div>
              {data.images.map((img, i) => (
                <li key={i} className="break-words">
                  <img src={img} alt="Oops" />
                </li>
              ))}
            </div>

            <div>
              <div className="font-semibold">
                Paragraphs ({data.paraText.length})
              </div>
              {data.paraText.map((p, i) => (
                <li key={i} className="break-words">
                  {p}
                </li>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
