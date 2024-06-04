class Color
  ANSI_COLORS = 16

  def self.set_color_depth(value)
    @@color_depth = value
  end

  def self.fg(r,g,b, output: @@color_depth)
    case output
    when :_24bit
      new(r,g,b).to_24bit
    when :_256
      new(r,g,b).to_256
    end
  end

  def self.bg(r,g,b, output: @@color_depth)
    case output
    when :_24bit
      new(r,g,b).to_24bit(mode: :bg)
    when :_256
      new(r,g,b).to_256(mode: :bg)
    end
  end

  def self.reset
    "\e[0m"
  end

  def self.from_hex(value)
    rgb = value
      .sub("#", '')
      .chars
      .each_slice(2)
      .map{ |val| val.join.to_i(16) }

    new(*rgb)
  end

  def initialize(r, g, b)
    @r = r
    @g = g
    @b = b
  end

  def to_rgb
    [@r, @g, @b]
  end

  def mode(mode)
    case mode
    when :fg then 38
    when :bg then 48
    end
  end

  # https://tintin.mudhalla.net/info/256color/
  def to_256(mode: :fg)
    # color = (r*6/256)*36 + (g*6/256)*6 + (b*6/256)
    code = ANSI_COLORS +
      (36 * ansi_weight(@r).to_i) +
      (6 * ansi_weight(@g).to_i) +
      (1 * ansi_weight(@b).to_i)

    "\e[#{mode(mode)};5;#{code}m"
  end

  private def ansi_weight(value)
    (5 * value) / 255.0
  end

  def to_24bit(mode: :fg)
    "\e[#{mode(mode)};2;#{@r};#{@g};#{@b}m"
  end
end
