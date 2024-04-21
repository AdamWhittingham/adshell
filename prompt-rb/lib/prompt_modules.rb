require_relative 'color'
require_relative 'theme'

class PromptModules
  def self.init(theme)
    @@theme = theme
  end
end

class PromptModule < PromptModules
  def theme
    @@theme
  end
end

Dir[File.join(__dir__, 'prompt_modules', '*.rb')].each do |file|
  require file
end

