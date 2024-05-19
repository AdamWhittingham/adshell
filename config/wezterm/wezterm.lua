local wezterm = require 'wezterm'

local config = {}
if wezterm.config_builder then
  config = wezterm.config_builder()
end

config.enable_tab_bar = false

-- STFU
config.audible_bell = "Disabled"

-- Window Look & Feel
config.color_scheme = "adTerm"
config.window_decorations = "RESIZE"
config.font = wezterm.font('Hasklig')
config.font_size = 15.0
config.line_height = 1.1
config.cursor_thickness = 2.0

-- Key bindings
config.keys = {
  {
    key = 'r',
    mods = 'SUPER',
    action = wezterm.action.ReloadConfiguration,
  },
  {
    key = 'n',
    mods = 'SUPER',
    action = wezterm.action.SpawnWindow,
  },
  {
    key = 'c',
    mods = 'CMD',
    action = wezterm.action.CopyTo 'Clipboard',
  },
  {
    key = 'v',
    mods = 'CMD',
    action = wezterm.action.PasteFrom 'Clipboard',
  },
  {
    key = '[',
    mods = 'CMD|SHIFT',
    action = wezterm.action.DisableDefaultAssignment,
  },
  {
    key = ']',
    mods = 'CMD|SHIFT',
    action = wezterm.action.DisableDefaultAssignment,
  },
  {
    key = '{',
    mods = 'CMD',
    action = wezterm.action.DisableDefaultAssignment,
  },
  {
    key = '}',
    mods = 'CMD',
    action = wezterm.action.DisableDefaultAssignment,
  },
}


return config
