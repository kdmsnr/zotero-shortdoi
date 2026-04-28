# DOI Manager for Zotero 9

This is a Zotero 9 compatibility fork of [Zotero DOI Manager](https://github.com/bwiernik/zotero-shortdoi).

Fork release:

- Version: `1.5.1-zotero9-r1` (`manifest.json` version `1.5.1.1`)
- Add-on ID: `zotero-doi-manager-zotero9@kdmsnr.github.io`
- Tested with Zotero `9.0.1`

This is an add-on for Zotero, a research source management tool. The add-on can auto-fetch DOI names for journal articles using the CrossRef API, as well as look up shortDOI names using http://shortdoi.org. The add-on additionally verifies that stored DOIs are valid and marks invalid DOIs.

Please report fork-specific bugs, questions, or feature requests on this repository.

Code for this extension is based in part [Zotero Google Scholar Citations](https://github.com/beloglazov/zotero-scholar-citations) by Anton Beloglazov.

### Plugin Functions

  - Get shortDOIs: For the selected items, look up shortDOIs (replacing stored DOIs, if any) and mark invalid DOIs.
  - Get long DOIs: For the selected items, look up full DOIs (replacing stored DOIs, if any) and mark invalid DOIs.
  - Verify and clean DOIs: For the selected items, look up full DOIs (replacing stored DOIs, if any), verify that stored DOIs are valid, and mark invalid DOIs.
    - This function also removes unnecessary prefixes (such as `doi:`, `https://doi.org/`, or a publisher URL prefix) from the DOI field.

### How to Install

  - If the original DOI Manager add-on is installed, remove it first. This fork uses a different add-on ID, but it still shares the same preferences and menu element IDs.
  - Download `zotero-doi-manager-zotero9-1.5.1.1.xpi` from the [Zotero 9 fork release](https://github.com/kdmsnr/zotero-shortdoi/releases/tag/v1.5.1-zotero9-r1).
    - If you are using Firefox, be sure to right-click on the file link and choose Save Link As…
  - In Zotero, open the Tools → Plugins menu.
  - Drag the downloaded `.xpi` file to the Plugins popup window.
    - Alternatively, click on the Gear ⚙ button in the Plugins popup window, choose Install Add-On from File…, and select the downloaded `.xpi` file.

### License

Copyright (C) 2017 Brenton M. Wiernik

Distributed under the Mozilla Public License (MPL) Version 2.0.
