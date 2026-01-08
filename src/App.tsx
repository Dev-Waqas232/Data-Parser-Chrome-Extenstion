import { useEffect, useState } from "react";

type ParsedData = {
  title: string;
  siteUrl: string;
  numOfHeadings: number;
  numOfImages: number;
  numOfParagraphs: number;
};

export default function App() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.url) return;

        chrome.runtime.sendMessage(
          {
            type: "GET_PAGE_DATA",
            payload: { url: tab.url },
          },
          (response) => {
            if (response?.success && response.data) {
              setData(response.data);
            }
            setLoading(false);
          }
        );
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const handleParse = async () => {
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
        ).length;

        const images = Array.from(document.querySelectorAll("img")).length;

        const paraText = Array.from(document.querySelectorAll("p")).length;

        return {
          title,
          url,
          headingText,
          images,
          paraText,
        };
      },
    });

    chrome.runtime.sendMessage(
      {
        type: "NEW_MESSAGE",
        payload: result[0].result,
      },
      (response) => {
        if (response.success) {
          setData(response.data.data);
          setLoading(false);
        } else {
          console.log(response.error);
        }
      }
    );
  };

  return (
    <div className="w-80 h-[420px] bg-linear-to-br from-indigo-600 to-violet-600 p-3 text-white rounded-md flex flex-col gap-3">
      <div className="text-center">
        <h3 className="text-lg font-semibold tracking-wide">Data Parser</h3>
        <p className="text-xs text-indigo-100">
          Extract data from the current page
        </p>
      </div>

      <button
        onClick={handleParse}
        disabled={loading}
        className="w-full bg-white text-indigo-700 font-medium py-2 rounded-lg shadow-md hover:bg-indigo-50
          active:scale-[0.98] transition disabled:opacity-60"
      >
        {loading ? "Parsing..." : "Parse Page"}
      </button>

      <div className="flex-1 overflow-auto rounded-md bg-white/10 p-2 text-xs space-y-2">
        {loading && <p className="italic text-sm">Fetching Data...</p>}

        {!data && <p className="opacity-70 text-center">No data yet...</p>}

        {data && (
          <>
            <div>
              <div className="font-semibold">Title</div>
              <div className="break-words">Title: {data.title}</div>
            </div>

            <div>
              <div className="font-semibold">Site Url: ({data.siteUrl})</div>
            </div>

            <div>
              <div className="font-semibold">
                Number of headings: ({data.numOfHeadings})
              </div>
            </div>

            <div>
              <div className="font-semibold">
                Number of images: ({data.numOfImages})
              </div>
            </div>

            <div>
              <div className="font-semibold">
                Number of paragraphs: ({data.numOfParagraphs})
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
