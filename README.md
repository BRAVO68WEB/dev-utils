# Dev Utils

Dev Utils is a local toolbox for the request, document, or diagram in
front of you. It runs as one Node process on your machine. There are no
accounts and no server database. Your drafts, documents, and captured
requests stay in this browser.

## Start without cloning

You do not need this repository. With Bun installed, run:

```bash
bunx @bravo68web/dev-utils --port 1234
```

That downloads the package and starts the production server on
[http://127.0.0.1:1234](http://127.0.0.1:1234). Leave the port off to use
3000. The first run of a version copies the app to
`~/.cache/dev-utils` and builds it there, which needs a network
connection. The next run only starts the server. Pass `--rebuild` to
build again.

Open the printed URL. Webhook and HTTP addresses use that same host and
port.

## Run the app from this repo

Install dependencies with Bun, then start the dev server.

1. Run `bun install`.
2. Run `bun dev`.
3. Open [http://localhost:3000](http://localhost:3000).

`bun run build` then `bun start` runs the same app without the dev
server. `bun run test` runs the unit tests. `bun run lint` runs ESLint.

## Tools

The home page lists every tool. Press `⌘K` to jump, or press a shortcut
when the cursor is outside an editor. The extra tools use `j`, `k`,
`r`, and `s`.

| Tool | Path | Shortcut | What it does |
| --- | --- | --- | --- |
| Diff | `/diff` | 1 | Compare two texts, split or unified. |
| URL encode | `/url` | 2 | Encode or decode a component or a full URI. |
| URL params | `/params` | 3 | Read and edit query parameters, including duplicates. |
| Base64 | `/base64` | 4 | Encode or decode UTF-8 text, or a dropped file. |
| Webhooks | `/hooks` | 5 | Capture HTTP requests sent to this machine. |
| HTTP | `/http` | 6 | Paste curl or raw HTTP, edit it, and send it. |
| Format | `/format` | 7 | Format code with Prettier. |
| Markdown | `/markdown` | 8 | Write Markdown, preview it, and leave review notes. |
| UML | `/uml` | 9 | Render a Mermaid diagram and export SVG or PNG. |
| jq and grep | `/playground` | 0 | Run jq 1.8, or a JavaScript regular expression. |
| YAML | `/yaml` | - | Validate YAML and jump to the reported line. |
| JWT | `/jwt` | j | Read a token, edit the claims, and sign it again. |
| Keypairs | `/keys` | k | Generate a signing keypair and copy PEM or JWK. |
| Random | `/random` | r | Generate random strings from the sets you choose. |
| JS sandbox | `/sandbox` | s | Run JavaScript in a frame that cannot read saved tools. |

URL encode can hand a decoded URL to the param viewer. A captured
webhook can open in the HTTP tool. Both handoffs are written to
IndexedDB before the next page loads.

## Where data is stored

Almost everything is stored in an IndexedDB database named `dev-utils`
in this browser profile.

- `sessions` holds the current draft for each tool.
- `records` holds Markdown documents, UML diagrams, HTTP history, webhook
  inboxes, and captured webhook events.
- `settings` holds small preferences such as the last opened tool.

A draft is saved after the page has loaded the stored copy and you edit
it. Refreshing the page restores that copy. Restarting the dev server
does not delete it.

The theme choice is the exception. It is stored in `localStorage` under
`dev-utils:theme` so the first paint matches your last choice. Choose
Dracula, light, or system from the header. System uses Dracula when
your device is in dark mode.

On a tool page, **Export** downloads that tool's saved data as JSON. On
the home page, **Export** downloads every session, record, and setting.
**Import** on the home page merges a file by primary key. **Clear** asks
you to confirm, then deletes the current tool, or everything when you
are on the home page.

If the browser refuses to store more data, export a copy or clear a
tool.

## Webhooks

Create an inbox on the Webhooks page. Send any HTTP method to
`/in/<inbox-id>` on this server, including extra path segments. While
that page is open, the event is written to IndexedDB and then removed
from the server queue.

<!-- prettier-ignore -->
> [!WARNING]
> A request is durable only after an open tab stores it. The server
> keeps unacknowledged requests in memory, up to 100 per inbox and 256 KB
> of body. Restarting the process drops anything still in that queue. A
> request that arrives while the page is closed is gone after `bun dev`
> restarts, even if the inbox row is still in IndexedDB.

The mock response (status, content type, and body) is stored with the
inbox and registered again when you open it. Each inbox keeps up to 200
captured events in IndexedDB.

## HTTP proxy

The HTTP tool sends through this server, so the browser's CORS rules do
not apply. The process can reach any `http` or `https` URL the machine
can reach, including localhost and private network addresses.

Cloud metadata hosts `169.254.169.254` and `metadata.google.internal`
are blocked on the first request and on every redirect unless you turn
on **Allow cloud metadata addresses**. A call times out after 30
seconds, follows at most five redirects, and stores at most 256 KB of
the response. A `301`, `302`, or `303` continues as `GET` without the
body. The request body you send must be 1 MB or smaller.

## Next steps

Open the home page, pick a tool, and refresh it. The draft you typed
comes back from this browser.
