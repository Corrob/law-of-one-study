import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchInput from "../SearchInput";

describe("SearchInput", () => {
  const mockOnChange = jest.fn();
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with placeholder", () => {
    render(
      <SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    // Translation key is returned by mock
    expect(screen.getByPlaceholderText("search.placeholder")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onSearch={mockOnSearch}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
  });

  it("displays the provided value", () => {
    render(
      <SearchInput value="test query" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    render(
      <SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "love");

    // onChange is called for each character typed
    expect(mockOnChange).toHaveBeenCalledTimes(4);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, "l");
    expect(mockOnChange).toHaveBeenNthCalledWith(2, "o");
    expect(mockOnChange).toHaveBeenNthCalledWith(3, "v");
    expect(mockOnChange).toHaveBeenNthCalledWith(4, "e");
  });

  it("calls onSearch when Enter is pressed", async () => {
    const user = userEvent.setup();
    render(
      <SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "{Enter}");

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("shows Search button when value is present", () => {
    render(
      <SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    // Translation key is returned by mock
    expect(screen.getByRole("button", { name: "search.searchButton" })).toBeInTheDocument();
  });

  it("hides Search button when value is empty", () => {
    render(
      <SearchInput value="" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    // Translation key is returned by mock
    expect(screen.queryByRole("button", { name: "search.searchButton" })).not.toBeInTheDocument();
  });

  it("calls onSearch when Search button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SearchInput value="test" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    await user.click(screen.getByRole("button", { name: "search.searchButton" }));

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("disables Search button when value is too short", () => {
    render(
      <SearchInput value="a" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    // Translation key is returned by mock
    expect(screen.getByRole("button", { name: "search.searchButton" })).toBeDisabled();
  });

  it("enables Search button when value is long enough", () => {
    render(
      <SearchInput value="ab" onChange={mockOnChange} onSearch={mockOnSearch} />
    );

    // Translation key is returned by mock
    expect(screen.getByRole("button", { name: "search.searchButton" })).not.toBeDisabled();
  });

  it("disables Search button when loading", () => {
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onSearch={mockOnSearch}
        isLoading
      />
    );

    expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
  });

  it("shows loading indicator when isLoading is true", () => {
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onSearch={mockOnSearch}
        isLoading
      />
    );

    expect(screen.getByRole("button", { name: "..." })).toBeInTheDocument();
  });
});
