require 'yaml'
require_relative 'color'

class Theme
  DEFAULT = {
    red:    "#E80000",
    yellow: "#E8A800",
    blue:   "#2244FE",
    green:  "#33DD00",
    purple: "#9130F0",
  }

  attr_reader :red
  attr_reader :yellow
  attr_reader :blue
  attr_reader :green
  attr_reader :purple

  def initialize(file: nil)
    if file
      theme = YAML.load_file(file)
    else
      theme = DEFAULT
    end

    @red    = Color.from_hex(theme[:red])
    @yellow = Color.from_hex(theme[:yellow])
    @blue   = Color.from_hex(theme[:blue])
    @green  = Color.from_hex(theme[:green])
    @purple = Color.from_hex(theme[:purple])
  end
end
