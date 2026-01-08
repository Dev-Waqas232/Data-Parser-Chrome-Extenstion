chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_MESSAGE") {
    (async () => {
      try {
        const response = await fetch("http://localhost:5000", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message.payload),
        });

        if (!response.ok) {
          sendResponse({ success: false, data: null });
          return;
        }

        const data = await response.json();

        sendResponse({ success: true, data });
      } catch (error) {
        console.log(error);
        sendResponse({ success: false, data: null });
      }
    })();

    return true; // to keep the channel between background worder and our extension alive, otherwise it would end it without waiting for the response and we would get an error
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_DATA") {
    (async () => {
      try {
        const { url } = message.payload;

        const res = await fetch(
          `http://localhost:5000?url=${encodeURIComponent(url)}`
        );

        const json = await res.json();

        sendResponse({ success: true, data: json.data });
      } catch (err) {
        console.error("Background fetch failed", err);
        sendResponse({ success: false });
      }
    })();

    return true;
  }
});
