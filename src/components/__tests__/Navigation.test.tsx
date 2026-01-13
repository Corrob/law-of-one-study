import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";

// Mock next/navigation
const mockPathname = jest.fn(() => "/");
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ back: mockBack }),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock LanguageContext for BurgerMenu's LanguageSelector
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: jest.fn(() => ({
    language: "en",
    setLanguage: jest.fn(),
  })),
  LANGUAGE_DISPLAY_NAMES: { en: "English", es: "Español" },
  AVAILABLE_LANGUAGES: ["en", "es"],
}));

import Header from "../Header";
import BurgerMenu from "../BurgerMenu";

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe("Header", () => {
  const mockOnMenuClick = jest.fn();
  const mockOnNewChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue("/");
  });

  it("renders dashboard header with logo and title on home page", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    expect(screen.getByText("Law of One Study Companion")).toBeInTheDocument();
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("renders back button on feature pages", () => {
    mockPathname.mockReturnValue("/chat");
    render(<Header onMenuClick={mockOnMenuClick} />);

    expect(screen.getByLabelText("Go to home")).toBeInTheDocument();
    expect(screen.getByText("Seek")).toBeInTheDocument();
  });

  it("shows correct page title for each route", () => {
    const routes = [
      { path: "/chat", title: "Seek" },
      { path: "/explore", title: "Explore" },
      { path: "/paths", title: "Study" },
      { path: "/search", title: "Search" },
      { path: "/about", title: "About" },
    ];

    routes.forEach(({ path, title }) => {
      mockPathname.mockReturnValue(path);
      const { unmount } = render(<Header onMenuClick={mockOnMenuClick} />);
      expect(screen.getByText(title)).toBeInTheDocument();
      unmount();
    });
  });

  it("calls onMenuClick when menu button is clicked", () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it("shows New button on chat page when showNewChat is true", () => {
    mockPathname.mockReturnValue("/chat");
    render(
      <Header
        onMenuClick={mockOnMenuClick}
        onNewChat={mockOnNewChat}
        showNewChat={true}
      />
    );

    expect(screen.getByLabelText("Start new conversation")).toBeInTheDocument();
  });

  it("hides New button when showNewChat is false", () => {
    mockPathname.mockReturnValue("/chat");
    render(
      <Header
        onMenuClick={mockOnMenuClick}
        onNewChat={mockOnNewChat}
        showNewChat={false}
      />
    );

    expect(screen.queryByLabelText("Start new conversation")).not.toBeInTheDocument();
  });

  it("calls onNewChat when New button is clicked", () => {
    mockPathname.mockReturnValue("/chat");
    render(
      <Header
        onMenuClick={mockOnMenuClick}
        onNewChat={mockOnNewChat}
        showNewChat={true}
      />
    );

    fireEvent.click(screen.getByLabelText("Start new conversation"));
    expect(mockOnNewChat).toHaveBeenCalledTimes(1);
  });
});

describe("BurgerMenu", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue("/");
  });

  it("renders nothing when closed", () => {
    renderWithProviders(<BurgerMenu isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders menu when open", () => {
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Seek")).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Study")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    // The backdrop has aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("highlights current page in navigation", () => {
    mockPathname.mockReturnValue("/chat");
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    const seekLink = screen.getByRole("menuitem", { name: "Seek" });
    expect(seekLink).toHaveAttribute("aria-current", "page");
  });

  it("includes theme toggle", () => {
    renderWithProviders(<BurgerMenu isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText("Theme")).toBeInTheDocument();
  });
});
