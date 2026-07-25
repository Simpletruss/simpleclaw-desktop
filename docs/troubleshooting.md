# Troubleshooting

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Plugins](plugins.md) · [Safety & privacy](safety-and-privacy.md)

Quick fixes for the most common issues.

---

| Symptom | Likely cause / fix |
|---------|--------------------|
| No response, errors, or "can't connect" | Re-check **Base URL**, **API key**, and **Model name** in Settings. Confirm the endpoint is reachable from your machine (network/VPN). |
| Model replies but actions seem random | The model may not be **vision-capable**, or the wrong model name is set. Use a vision model. |
| Clicks land in the wrong place | Run in **Dry run** first and verify the marker. Make sure the target window is fully visible on the **primary** display and isn't moved or resized mid-run. |
| It stops partway through a long task | You may have hit **Max steps**. Increase it in Settings, or split the task into smaller goals. |
| It won't stop | Press **`F9`** — it works even when SimpleClaw is in the background. |
| "It does nothing" | **Dry run** is probably still ON. Turn it off once you're ready for real actions. |
| Actions happen too fast to follow | Increase the **Step delay** in Settings so each step is easier to watch and interrupt. |

## Still stuck?

- Re-read [Getting started](getting-started.md) to confirm setup.
- Check the [User guide](user-guide.md) settings reference.
- Make sure you're on the latest build from the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).
