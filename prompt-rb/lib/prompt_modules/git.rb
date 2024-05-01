class Git < PromptModule
  def initialize(show_icon: true)
    super()
    @show_icon = show_icon
  end

  def to_s
    icon = @show_icon ? ' ' : ''
    branch = `git rev-parse --abbrev-ref HEAD`.chomp
    unstaged_changes = !system('git diff-index --quiet HEAD --')
    modified = unstaged_changes ? '' : ''

    [
      icon,
      branch,
      modified,
    ].join
  end
end
