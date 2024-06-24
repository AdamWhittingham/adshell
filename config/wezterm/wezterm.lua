local wezterm = require 'wezterm'

local config = {}
if wezterm.config_builder then
  config = wezterm.config_builder()
end

-- wezterm.gui is not available to the mux server, so take care to
-- do something reasonable when this config is evaluated by the mux
local function get_appearance()
  if wezterm.gui then
    return wezterm.gui.get_appearance()
  end
  return 'Dark'
end

local function scheme_for_appearance(appearance)
  if appearance:find 'Dark' then
    config.window_background_gradient = {
      colors = {
        '#000b28',
        '#000723',
      },
      orientation = 'Vertical',
      interpolation = 'Linear',
      blend = 'Hsv',
      noise = 32,
    }
    return 'adTerm'
  else
    return 'Tokyo Night Day'
  end
end

config.enable_tab_bar = false

-- STFU
config.audible_bell = "Disabled"

-- Window Look & Feel
config.color_scheme = "adTerm"
config.window_decorations = "RESIZE"
config.font = wezterm.font('Hasklig', { weight = 'Medium' })
config.font_size = 16.0
config.line_height = 1.1
config.cursor_thickness = 2.0

config.color_scheme = scheme_for_appearance(get_appearance())

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
