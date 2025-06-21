## DocFilter Browser Integration Specification

### 1. Objective

Enable users to send URLs—including PDF links—from their browser (e.g., Firefox) to DocFilter for automated processing (e.g., “read/skip” recommendation), using a bookmarklet and custom URL protocol handler.  
Ensure robust handling of tracking parameters, PDFs, and single-instance operation.

---

### 2. Functional Requirements

#### 2.1 Protocol Handler
- DocFilter registers as the handler for a custom protocol (e.g., `docfilter://`).
- When invoked with a URL (e.g., `docfilter://process?url=https%3A%2F%2Farxiv.org%2Fpdf%2F2406.12345.pdf`), DocFilter extracts and processes the `url` parameter.
#### 2.2 Bookmarklet Integration
- Provide a bookmarklet for users to add to their bookmarks bar:
    javascript
    CopyEdit
    `javascript:window.open('docfilter://process?url=' + encodeURIComponent(window.location.href))`
- When clicked, this bookmarklet sends the **current page URL** to DocFilter via the custom protocol handler.
- Browser prompts user to open DocFilter if not already running.
    
#### 2.3 URL Canonicalization and Tracking Parameter Stripping
- On receiving a URL, DocFilter must:
    - Parse the target URL from the protocol argument.
    - Remove common tracking/query parameters (e.g., `utm_source`, `utm_medium`, `gclid`, `fbclid`, `mc_cid`, `ref`, etc.).
    - Optionally, make the list of tracking parameters configurable.
    - Continue processing with the cleaned URL.

#### 2.4 PDF Detection and Handling
- If the received URL ends with `.pdf` or has a content type of `application/pdf`:
    - DocFilter attempts to **download** the PDF from the URL.
    - If successful, DocFilter processes the PDF as if uploaded directly by the user.
    - If the PDF is inaccessible (requires authentication or is not public), DocFilter shows an error message.
- PDF links from public repositories (e.g., arXiv) are expected to work seamlessly.
#### 2.5 Single-Instance Enforcement
- DocFilter must ensure only **one running instance** processes URLs.
- If the app is already running:
    - The protocol handler sends the new URL to the running instance (e.g., via IPC, socket, etc.).
    - The new invocation immediately exits after passing the URL.
- If the app is not running:
    - The protocol handler starts the main app with the URL as an argument.
    - The app initializes, then processes the URL.

---

### 3. Edge Case Considerations

#### 3.1 Non-Public PDFs
- If the provided URL points to a PDF that is **not publicly accessible** (e.g., requires login/cookies), DocFilter must gracefully report a failure and notify the user.
    
#### 3.2 Local Files
- If a user opens a local PDF (`file://...`) in the browser and uses the bookmarklet:
    - Bookmarklet may fail due to browser security restrictions.
    - DocFilter does **not** process `file://` URLs sent by this mechanism.
    - For local files, user should use the manual upload feature.

#### 3.3 Bookmarklet Limitations
- Bookmarklet only works for pages/tabs where JavaScript runs (e.g., not on internal browser pages, some PDF viewers, or sandboxed iframes).
- Bookmarklet sends the currently visible URL (not necessarily the source of an embedded PDF, e.g., in special viewers).

#### 3.4 Multiple Rapid Invocations
- If user triggers the bookmarklet repeatedly, DocFilter queues or serializes processing as appropriate.
- Processing of each URL is independent; duplicate invocations are allowed but not merged.

#### 3.5 Browser Prompts
- When first using the bookmarklet, the browser may prompt to allow opening “external application.”
    - Users can “remember” this choice for convenience.
    - Provide onboarding/documentation for users encountering this prompt.

---
### 4. Security Considerations
- DocFilter must sanitize all incoming URLs to avoid code injection or malformed input.
- Protocol handler should reject malformed or dangerous URLs.
- Local HTTP API (if used) must bind only to `localhost` and validate all inputs.

---
### 5. Extensibility (Future)
- Consider a browser extension for richer features (context menu, selection processing, etc.).
- Support sending additional metadata (title, selection, etc.) via protocol or HTTP.
- Optionally add support for mobile platforms or other browsers.

---
## Implementation Notes
- **Protocol Handler Registration**: OS-specific—document and test for each supported platform.
- **Bookmarklet Distribution**: Provide a copy-paste snippet and simple user instructions.
- **Tracking Parameter List**: Make easily updatable/configurable for evolving needs.
- **Single-Instance Pattern**: Use Electron/Node’s built-in single instance lock, or platform-native equivalents (mutex, socket, etc.).
- **PDF Download**: Use robust error handling and timeouts for downloads.

---
## Summary Flow
1. **User on web page (HTML or PDF)** →
2. **Clicks bookmarklet** →
3. **Browser opens DocFilter with `docfilter://process?url=...`** →
4. **DocFilter receives and strips tracking parameters** →
5. **If `.pdf`, downloads and processes the PDF** →
6. **Ensures single instance** (routes to main app if already running) →
7. **Shows result to user (read/skip)**
