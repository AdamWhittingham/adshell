[DinkDonk/kitty-icon](https://github.com/DinkDonk/kitty-icon)

# Installation

1. Find `kitty.app` in the `Applications` folder, select it and press `⌘ + i`.
2. Drag `kitty-dark.icns` or `kitty-light.icns` onto the application icon in the `kitty info` pane.
3. Delete the icon cache and restart `Dock`:

```bash
$ rm /var/folders/*/*/*/com.apple.dock.iconcache; killall Dock
```
