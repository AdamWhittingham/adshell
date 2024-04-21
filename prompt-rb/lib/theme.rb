require 'yaml'
require_relative 'color'

class Theme
  DEFAULT = {
    red:    "#E80000",
    yellow: "#E8A800",
    blue:   "#2244FE",
    green:  "#33DD00",
    purple: "#9130F0",
    grey:   "#333333",
    white:  "#E0E0E0",
  }

  DEFAULT.keys.map { |key| attr_reader key }
  ColorStrings = Struct.new(*DEFAULT.keys) do
    def reset
      Color.reset
    end
  end

  def initialize(file: nil)
    if file
      theme = YAML.load_file(file)
    else
      theme = DEFAULT
    end

    DEFAULT.keys.map do |key|
      instance_variable_set "@#{key}", Color.from_hex(theme[key])
    end
  end

  def to_24bit
    values = DEFAULT.keys.map { |key| send(key)  }
    ColorStrings.new(*values.map(&:to_24bit))
  end

  def to_256
    values = DEFAULT.keys.map { |key| send(key)  }
    ColorStrings.new(*values.map(&:to_256))
  end
end
