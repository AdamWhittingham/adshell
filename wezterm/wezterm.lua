local wezterm = require 'wezterm'

local config = {}
if wezterm.config_builder then
  config = wezterm.config_builder()
end

config.enable_tab_bar = false

-- Window Look & Feel
config.color_scheme = "adTerm"
config.window_decorations = "RESIZE"
config.font = wezterm.font('Hasklig', { weight = 'Medium' })
config.font_size = 14.0
config.line_height = 1.1
config.cursor_thickness = 2.0

-- Key bindings
config.keys = {
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
