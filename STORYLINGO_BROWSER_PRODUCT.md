# StoryLingo Browser Product Rules

Last updated: 25 September 2026

## Product focus

StoryLingo Browser is a focused reading and vocabulary browser. Its core loop is:

**read → select/click a word → translate → save → sync**

Do not expand the product into a general Chrome replacement. New browser features must clearly improve reading, language learning, vocabulary, accessibility, offline reading, or account continuity.

## First-run and What's New

- First-run coach marks appear once per browser major version.
- Users can reopen the tour from **Settings → What's New & Help**.
- Returning users should not be interrupted on every launch.
- Keep onboarding short and progressive.

## Saved words and conflicts

- Saving gives immediate feedback: the popup becomes **★ SAVED** and the browser shows a short **Saved to My Words** toast.
- The server key is the combination of user, word, source language, and target language.
- Saving the exact same entry again is treated as **already saved**.
- Saving the same key with a different translation updates that entry; the latest successful save becomes the current translation.
- Do not create silent duplicates for the same word/language key.

## Cross-device continuity

- Vocabulary writes go directly to the StoryLingo account store when signed in.
- Profile/native-language state refreshes on browser/account activity.
- Do not claim that a setting or reading position is synced unless that data is actually stored in the StoryLingo account backend.
- Future sync indicators should distinguish Vocabulary, Reading progress, and Settings instead of using a vague global status.

## Offline reading

Offline work must be reliable before it is marketed as complete.

Required design for the download manager:
- explicit **Available offline** status;
- clear file size and total storage use;
- polished empty state;
- storage-quota check before large downloads;
- low-storage warning with a direct **Manage downloads** action;
- whole-series downloads where useful;
- language-pack download only when the package size is shown before confirmation;
- lazy rendering/virtualisation for large libraries;
- indexed metadata rather than scanning every offline file on each launch;
- removal controls for individual stories, series, and old downloads;
- avoid silently deleting user-selected offline content.

Previously opened StoryLingo stories may use the website/PWA cache, but that is not a substitute for an explicit browser download manager.

## Accessibility

- Word translation popup must have dialog semantics and an accessible name.
- Save/close controls must have screen-reader labels.
- Keyboard users can select text and press **Alt+Shift+T** to translate.
- **Esc** closes the translation popup.
- Visible focus states are required throughout StoryLingo browser UI.
- Toasts/status messages use polite live regions.
- Do not move keyboard focus unexpectedly for mouse users.

## Privacy

- Settings must link to the StoryLingo Privacy Policy.
- Browser UI must not make broader privacy claims than the actual StoryLingo implementation.
- Any analytics or optional tracking added to the browser requires the same consent discipline as StoryLingo web.

## Empty states

Provide deliberate empty states for:
- no saved words;
- signed-out saved words;
- no offline downloads;
- no sync data yet;
- unavailable/offline account services.

Empty states should explain the next useful action without adding unrelated browser features.
