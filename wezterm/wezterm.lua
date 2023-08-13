local wezterm = require 'wezterm'

local config = {}
if wezterm.config_builder then
  config = wezterm.config_builder()
end

config.enable_tab_bar = false

-- Window Look & Feel
config.color_scheme = "adTerm"
config.window_decorations = "RESIZE"
config.font = wezterm.font 'Hasklig'
config.font_size = 14.0
config.line_height = 1.1


-- Key bindings
config.keys = {
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
