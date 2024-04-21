class Cursor < PromptModule
  def initialize(char: "❯")
    super()
    @char = char
  end

  def to_s
    exit_code = `echo $?`

    if exit_code && exit_code.to_i != 0
      color = theme.red
    else
      color = theme.blue
    end

    "#{color.to_24bit}#{@char}#{Color.reset}"
  end
end
