class Git < PromptModule
  def initialize
    super()
  end

  def to_s
    branch = `git rev-parse --abbrev-ref HEAD`

    " #{branch}"
  end
end
