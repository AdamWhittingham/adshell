require_relative 'color'
require_relative 'theme'

Color.set_color_depth(:_24bit)

class PromptModules
  def self.init(theme)
    @@theme = theme
  end
end

class PromptModule < PromptModules
  def theme
    @@theme
  end

  def color_depth
    :_24bit
  end
end

Dir[File.join(__dir__, 'prompt_modules', '*.rb')].each do |file|
  require file
end

