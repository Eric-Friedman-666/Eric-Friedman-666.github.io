# Research Homepage

This directory contains a local static research homepage for Eric Friedman (Qingyuan Liang). It presents a short CV, research work, five main active projects, selected outputs, and live progress cards.

## Run

```bash
cd /Users/liangqingyuan/Desktop/research_homepage
python3 -m http.server 5177
```

Open in a browser:

```text
http://127.0.0.1:5177
```

## Edit content

- Profile, CV, work history, projects, outputs, future directions, and contact: edit `data/profile.json`
- Live progress cards: edit `data/progress.json`
- The page reloads `data/progress.json` every 30 seconds

## Future live-data sources

The current version implements near-live updates by polling a JSON file. Later, `progressUrl` in `script.js` can point to:

- A server status API
- A periodically updated JSON file on GitHub Pages
- A Google Sheet JSON export
- A remote job-status summary generated from the research server
