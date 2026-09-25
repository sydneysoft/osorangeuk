# OrangeSoft Browser release signing

Production releases must be signed. The release workflow intentionally fails instead of publishing an unsigned binary when signing credentials are missing.

## macOS

Use an Apple **Developer ID Application** certificate for direct distribution and notarize the app.

Add these GitHub Actions repository secrets:

- `MAC_CSC_LINK` — base64-encoded Developer ID Application `.p12`.
- `MAC_CSC_KEY_PASSWORD` — password used when exporting the `.p12`.
- `APPLE_ID` — Apple Developer account email.
- `APPLE_APP_SPECIFIC_PASSWORD` — app-specific password for notarization.
- `APPLE_TEAM_ID` — Apple Developer Team ID.

The workflow maps `MAC_CSC_LINK` to electron-builder's `CSC_LINK`, enables forced signing, notarizes the app and validates the stapled notarization ticket before publishing.

## Windows

The current workflow supports an exportable Authenticode certificate such as a standard OV code-signing certificate.

Add these GitHub Actions repository secrets:

- `WIN_CSC_LINK` — base64-encoded `.pfx` / `.p12` signing certificate.
- `WIN_CSC_KEY_PASSWORD` — certificate password.

The workflow enables forced signing and verifies that the generated NSIS installer has a valid Authenticode signature before publishing.

If OrangeSoft uses a hardware-backed EV certificate or Azure Trusted Signing instead, adapt the Windows signing backend rather than exporting the private key.

## Security

Never commit certificates, private keys, app-specific passwords or certificate passwords to the repository. Keep them only in GitHub Actions secrets or the chosen managed signing service.
