# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One developer, on this machine, working through the request in front of them. There is no shared account and no second audience.

## Product Purpose

Dev Utils is a local toolbox for that request: compare text, encode and decode, inspect a URL, send HTTP, catch a webhook, format code, review Markdown, render a diagram, and check YAML or jq. Success means the job finishes in the browser and the draft is still there after a refresh.

## Positioning

The work stays in this browser. The server is only a pipe for webhook capture and for HTTP calls the browser cannot make itself. A neighboring hosted client cannot truthfully claim that.

## Operating Context

Run it with Bun on localhost. The home page lists the tools. Keyboard shortcuts 1–9, 0, and - jump between them when focus is outside an editor. Command-K opens the tool switcher.

## Capabilities and Constraints

Eleven tools: Diff, URL encode, URL params, Base64, Webhooks, HTTP, Format, Markdown, UML, jq and grep, and YAML.

Drafts, documents, HTTP history, and captured webhooks are stored in IndexedDB in this browser profile. The theme choice is the only localStorage exception, so the first paint is correct.

A webhook is durable only after an open tab stores it. The process keeps unacknowledged requests in memory. Restarting the dev server drops those.

The HTTP proxy can reach what this machine can reach, except the cloud metadata hosts, which stay blocked unless the checkbox is on.

There are no accounts, no server database, and no cross-device sync.

## Brand Commitments

The product name is Dev Utils. Voice is direct and addressed to you. Dracula is the dark theme, including when the system theme follows a dark device. Light remains available.

## Evidence on Hand

The running app is the evidence. There are no testimonials, customers, or press claims, and future work must not invent them.

## Product Principles

- Keep the work on this machine, in this browser.
- The server forwards. It does not remember.
- A tool should finish the job that is already on screen.
- Do not add accounts, sync, or a second store.
- Say what happened, including when a webhook will not survive a restart.
