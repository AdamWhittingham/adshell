class Asdf < PromptModule
  DEFAULT_CONFIG = {
    "ruby"   => {alias: " ", color: "#bb2222" },
    "golang" => {alias: "",  color: "#33b8ff" },
    "nodejs" => {alias: "",  color: "#63bc82" },
  }

  IGNORED_LINES = /^(\s|Notice:)/
  VERSION_REGEX = /^(?<tool>\w+)\s+(?<version>[\w\.]+)\s+(?<source>\S+)/

  def initialize(mode: :all, config: {})
    super()

    @config = DEFAULT_CONFIG.deep_merge(config)
    @global_versions = File.join(Dir.home, ".tool-versions")
    @mode = mode
  end

  def to_s
    tools = {}
    raw = `asdf current 2>/dev/null`

    lines = raw.lines.reject { |line| line.match?(IGNORED_LINES)}
    lines.each do |line|
      if match = line.match(VERSION_REGEX)
        source = match[:source]

        if source != @global_versions || @mode == :all
          tools[match[:tool]] = match[:version]
        end
      end
    end

    tools.map do |tool, version|
      if tool_config = @config[tool]
        out = []
        if color = tool_config[:color]
          out << Color.from_hex(color).to_24bit
        end

        if name = tool_config[:alias]
          out << name
        else
          out << tool
        end

        out << " "
        out << version

        out << Color.reset

        out.join("")
      else
        [tool, version].join(" ")
      end
    end.join(" ")
  end

end
