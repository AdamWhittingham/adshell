require 'pathname'

class Path < PromptModule
  def initialize(mode = nil, max_length: 200)
    super()
    @mode = mode || :default
    @max_length = max_length
  end

  def to_s
    path = Pathname.new(Dir.pwd)

    case @mode
    when :last
      _, last = path.split
      last.to_s
    when :absolute
      path.to_s
    when :from_home
      home_relative(path)
    when :abbrev, :abbreviated, :default
      abbreviated(path)
    end
  end

  def home_relative(path)
    '~' + path.to_s.sub(Dir.home.to_s, '')
  end

  def abbreviated(path)
    if path.to_s.length > @max_length
      split = Pathname(home_relative(path)).each_filename.to_a
      parts = split[1..-2].map { |dirname| dirname[0] }
      parts << split.last
      out = File.join(parts)
    else
      out = path
    end
    out.to_s
  end
end
