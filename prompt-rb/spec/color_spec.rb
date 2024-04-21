require_relative "../lib/color.rb"

describe Color do
  describe "#to_256" do
    it "can convert RGB to 256 color" do
      expect(described_class.new(0, 0, 0).to_256).to eq "\e[38;5;16m"

      expect(described_class.new(255, 0, 0).to_256).to eq "\e[38;5;196m"
      expect(described_class.new(0, 255, 0).to_256).to eq "\e[38;5;46m"
      expect(described_class.new(0, 0, 255).to_256).to eq "\e[38;5;21m"

      expect(described_class.new(255, 255, 0).to_256).to eq "\e[38;5;226m"
      expect(described_class.new(0, 255, 255).to_256).to eq "\e[38;5;51m"
      expect(described_class.new(255, 255, 255).to_256).to eq "\e[38;5;231m"

      # Spring Green 3
      expect(described_class.new(0, 175, 95).to_256).to eq "\e[38;5;35m"

      # Cadet Blue
      expect(described_class.new(95, 175, 175).to_256).to eq "\e[38;5;73m"
    end
  end

  describe "#to_24bit" do
    it "ouputs 24bit color" do
      expect(described_class.new(0, 0, 0).to_24bit).to eq "\e[38;2;0;0;0m"

      expect(described_class.new(255, 0, 0).to_24bit).to eq "\e[38;2;255;0;0m"
      expect(described_class.new(0, 255, 0).to_24bit).to eq "\e[38;2;0;255;0m"
      expect(described_class.new(0, 0, 255).to_24bit).to eq "\e[38;2;0;0;255m"

      expect(described_class.new(255, 255, 0).to_24bit).to eq "\e[38;2;255;255;0m"
      expect(described_class.new(0, 255, 255).to_24bit).to eq "\e[38;2;0;255;255m"
      expect(described_class.new(255, 255, 255).to_24bit).to eq "\e[38;2;255;255;255m"

      # Spring Green 3
      expect(described_class.new(0, 175, 95).to_24bit).to eq "\e[38;2;0;175;95m"

      # Cadet Blue
      expect(described_class.new(95, 175, 175).to_24bit).to eq "\e[38;2;95;175;175m"
    end
  end

  describe "from_hex" do
    it "converts to RGB" do
      expect(Color.from_hex("#ff0000").to_rgb).to eq [255, 0, 0]
      expect(Color.from_hex("#00ff00").to_rgb).to eq [0, 255, 0]
      expect(Color.from_hex("#0000ff").to_rgb).to eq [0, 0, 255]

      expect(Color.from_hex("#80ff40").to_rgb).to eq [128, 255, 64]
    end
  end
end
